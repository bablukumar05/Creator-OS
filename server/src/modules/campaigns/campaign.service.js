import { CAMPAIGN_SORT_FIELDS } from './campaign.constants.js';
import {
  archiveWithinOrganization,
  createForOrganization,
  findAllByOrganization,
  findByIdWithinOrganization,
  restoreWithinOrganization,
} from './campaign.repository.js';
import { findByIdWithinOrganization as findBrandByIdWithinOrganization } from '../brands/brand.repository.js';
import { Campaign } from './campaign.model.js';
import { Deliverable } from './deliverables/deliverable.model.js';
import { Approval } from './approvals/approval.model.js';
import { logCampaignActivity } from './activities/activity.service.js';
import { Member } from '../members/member.model.js';
import { models } from '../../../models/resources.js';
import { resources } from '../../../../shared/resources.js';
import { recordActivity } from '../../../services/resourceService.js';
import { tenantScope } from '../../middleware/organization.middleware.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_FIELDS = [
  'brand',
  'brandId',
  'description',
  'startDate',
  'endDate',
  'deliverables',
  'notes',
  'managerId',
];
async function verifyCampaignRelationsAndMembers(data, organizationId, ownerId) {
  const targetBrandId = data.brand || data.brandId;
  if (targetBrandId) {
    const brand = await findBrandByIdWithinOrganization(targetBrandId, organizationId, ownerId, {
      lean: true,
    });
    if (!brand) {
      throw new ApiError(400, 'Select a valid brand from your workspace.');
    }
    data.brand = brand._id;
    data.brandId = brand._id;
  }
  if (Array.isArray(data.assignedMembers) && data.assignedMembers.length > 0) {
    const uniqueUserIds = [...new Set(data.assignedMembers.map((id) => String(id)))];
    if (organizationId) {
      const activeCount = await Member.countDocuments({
        organizationId,
        userId: { $in: uniqueUserIds },
        status: 'active',
      });
      if (activeCount !== uniqueUserIds.length) {
        throw new ApiError(
          400,
          'All assigned members must be active members of this workspace.',
        );
      }
    } else if (uniqueUserIds.some((id) => id !== String(ownerId))) {
      throw new ApiError(400, 'All assigned members must belong to this workspace.');
    }
    data.assignedMembers = uniqueUserIds;
  }
}
export async function listCampaigns(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const includeDeleted = req.query.archived === 'true';
  const criteria = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 100)), 'i');
    criteria.$or = [{ title: rx }, { name: rx }, { objective: rx }, { tags: rx }];
  }
  if (req.query.status) criteria.status = String(req.query.status);
  if (req.query.platform) criteria.platform = String(req.query.platform);
  if (req.query.campaignType) criteria.campaignType = String(req.query.campaignType);
  if (req.query.objective) criteria.objective = String(req.query.objective);
  if (req.query.priority) criteria.priority = String(req.query.priority);
  if (req.query.managerId) criteria.managerId = String(req.query.managerId);
  const brandFilter = req.query.brand || req.query.brandId;
  if (brandFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(brandFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.brand = String(brandFilter);
  }
  if (req.query.assignedMember) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.assignedMember))) {
      throw new ApiError(400, 'Invalid member filter.');
    }
    criteria.assignedMembers = String(req.query.assignedMember);
  }
  if (req.query.from || req.query.to) {
    criteria.createdAt = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      if (!Number.isFinite(+from)) throw new ApiError(400, 'Invalid start date.');
      criteria.createdAt.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (!Number.isFinite(+to)) throw new ApiError(400, 'Invalid end date.');
      criteria.createdAt.$lte = to;
    }
  }
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
  const rawSort = String(req.query.sort || '-createdAt');
  const sortField = rawSort.replace(/^-/, '');
  const sort = CAMPAIGN_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
  const { items, total } = await findAllByOrganization(req.organizationId, ownerId, criteria, {
    includeDeleted,
    sort,
    skip: (page - 1) * limit,
    limit,
  });
  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}
export async function getCampaignById(req, campaignId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await findByIdWithinOrganization(campaignId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!campaign) throw new ApiError(404, 'Record not found.');
  return campaign;
}
export async function getCampaignRelatedRecords(req, campaignId) {
  const campaign = await getCampaignById(req, campaignId);
  const scopeFilter = tenantScope(req);
  const groups = await Promise.all(
    Object.entries(resources)
      .filter(([, config]) => config.fields.some((f) => f.key === 'campaign'))
      .map(async ([key, config]) => {
        const filter = { ...scopeFilter, campaign: campaign._id };
        const [items, total] = await Promise.all([
          models[key]
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title status amount')
            .lean(),
          models[key].countDocuments(filter),
        ]);
        return { resource: key, label: config.label, items, total };
      }),
  );
  return groups.filter((group) => group.total > 0);
}
export async function createCampaign(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyCampaignRelationsAndMembers(data, req.organizationId, ownerId);
  const campaign = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Created ${campaign.title}`, 'campaigns', campaign._id);
  await logCampaignActivity({
    organizationId: req.organizationId,
    campaignId: campaign._id,
    actorId: req.user._id,
    action: 'Campaign Created',
    metadata: { title: campaign.title, status: campaign.status, budget: campaign.budget },
  });
  return campaign;
}
export async function updateCampaign(req, campaignId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await findByIdWithinOrganization(campaignId, req.organizationId, ownerId);
  if (!campaign) throw new ApiError(404, 'Record not found.');
  const oldStatus = campaign.status;
  await verifyCampaignRelationsAndMembers(data, req.organizationId, ownerId);
  Object.assign(campaign, data);
  campaign.updatedBy = req.user._id;
  for (const field of CLEARABLE_FIELDS) {
    if (rawBody[field] === '') {
      campaign.set(field, undefined);
      if (field === 'brand' || field === 'brandId') {
        campaign.set('brand', undefined);
        campaign.set('brandId', undefined);
      }
    }
  }
  await campaign.save();
  await recordActivity(req, `Updated ${campaign.title}`, 'campaigns', campaign._id);
  if (data.status && data.status !== oldStatus) {
    await logCampaignActivity({
      organizationId: req.organizationId,
      campaignId: campaign._id,
      actorId: req.user._id,
      action: `Status Changed: ${oldStatus} → ${data.status}`,
      metadata: { from: oldStatus, to: data.status },
    });
  }
  return campaign;
}
export async function archiveCampaign(req, campaignId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await archiveWithinOrganization(
    campaignId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!campaign) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${campaign.title}`, 'campaigns', campaign._id);
  return campaign;
}
export async function duplicateCampaign(req, campaignId) {
  const original = await getCampaignById(req, campaignId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  const copyTitle = `${original.title} (copy)`;
  data.title = copyTitle;
  data.name = copyTitle;
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Duplicated ${original.title}`, 'campaigns', copy._id);
  return copy;
}
export async function restoreCampaign(req, campaignId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await restoreWithinOrganization(
    campaignId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!campaign) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${campaign.title}`, 'campaigns', campaign._id);
  return campaign;
}
export async function getCampaignAnalytics(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const scopeFilter = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [campaigns, totalDeliverables, completedDeliverables, overdueDeliverables, totalApprovals, approvedApprovals] =
    await Promise.all([
      Campaign.find(scopeFilter).select('status objective budget spentBudget remainingBudget progress').lean(),
      Deliverable.countDocuments(scopeFilter),
      Deliverable.countDocuments({ ...scopeFilter, status: { $in: ['Approved', 'Published'] } }),
      Deliverable.countDocuments({
        ...scopeFilter,
        dueDate: { $lt: startOfToday },
        status: { $nin: ['Approved', 'Published'] },
      }),
      Approval.countDocuments(scopeFilter),
      Approval.countDocuments({ ...scopeFilter, status: 'Approved' }),
    ]);
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => ['Active', 'Planning', 'Review'].includes(c.status)).length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'Completed').length;
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.spentBudget || 0), 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const approvalRate = totalApprovals > 0 ? Number(((approvedApprovals / totalApprovals) * 100).toFixed(1)) : 100;
  const campaignProgressAverage =
    totalCampaigns > 0
      ? Number((campaigns.reduce((acc, c) => acc + (c.progress || 0), 0) / totalCampaigns).toFixed(1))
      : 0;
  const byStatus = {};
  const byObjective = {};
  for (const c of campaigns) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    if (c.objective) byObjective[c.objective] = (byObjective[c.objective] || 0) + 1;
  }
  return {
    totalCampaigns,
    activeCampaigns,
    completedCampaigns,
    totalBudget,
    totalSpent,
    totalRemaining,
    totalDeliverables,
    completedDeliverables,
    overdueDeliverables,
    approvalRate,
    campaignProgressAverage,
    byStatus,
    byObjective,
  };
}
