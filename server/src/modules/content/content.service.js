import { CONTENT_SORT_FIELDS } from './content.constants.js';
import {
  archiveWithinOrganization,
  createForOrganization,
  findAllByOrganization,
  findByIdWithinOrganization,
  restoreWithinOrganization,
} from './content.repository.js';
import { findByIdWithinOrganization as findCampaignByIdWithinOrganization } from '../campaigns/campaign.repository.js';
import { Member } from '../members/member.model.js';
import { models } from '../../../models/resources.js';
import { resources } from '../../../../shared/resources.js';
import { recordActivity } from '../../../services/resourceService.js';
import { tenantScope } from '../../middleware/organization.middleware.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_FIELDS = [
  'description',
  'publishDate',
  'dueDate',
  'publishedAt',
  'scheduledTime',
  'category',
  'hashtags',
  'caption',
  'thumbnail',
  'media',
  'campaign',
  'campaignId',
  'assignedTo',
  'notes',
];
async function verifyContentRelationsAndAssignee(data, organizationId, ownerId) {
  const targetCampaignId = data.campaign || data.campaignId;
  if (targetCampaignId) {
    const campaign = await findCampaignByIdWithinOrganization(
      targetCampaignId,
      organizationId,
      ownerId,
      { lean: true },
    );
    if (!campaign) {
      throw new ApiError(400, 'Select a valid campaign from your workspace.');
    }
    data.campaign = campaign._id;
    data.campaignId = campaign._id;
  }
  const mediaScopeFilter = organizationId
    ? { $or: [{ organizationId }, { organizationId: null, owner: ownerId }], deletedAt: null }
    : { owner: ownerId, deletedAt: null };
  if (data.media) {
    const exists = await models.media.exists({ _id: data.media, ...mediaScopeFilter });
    if (!exists) {
      throw new ApiError(400, 'Select a valid media asset from your workspace.');
    }
  }
  if (Array.isArray(data.assets) && data.assets.length > 0) {
    const uniqueAssetIds = [...new Set(data.assets.map((id) => String(id)))];
    const validCount = await models.media.countDocuments({
      _id: { $in: uniqueAssetIds },
      ...mediaScopeFilter,
    });
    if (validCount !== uniqueAssetIds.length) {
      throw new ApiError(400, 'All attached media assets must belong to your workspace.');
    }
    data.assets = uniqueAssetIds;
  }
  if (data.assignedTo) {
    if (organizationId) {
      const isActiveMember = await Member.exists({
        organizationId,
        userId: data.assignedTo,
        status: 'active',
      });
      if (!isActiveMember) {
        throw new ApiError(400, 'Assigned user must be an active member of this workspace.');
      }
    } else if (String(data.assignedTo) !== String(ownerId)) {
      throw new ApiError(400, 'Assigned user must belong to this workspace.');
    }
  }
}
export async function listContent(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const includeDeleted = req.query.archived === 'true';
  const criteria = {};
  if (req.query.search) {
    criteria.title = {
      $regex: escapeRegex(String(req.query.search).slice(0, 100)),
      $options: 'i',
    };
  }
  if (req.query.status) criteria.status = String(req.query.status);
  if (req.query.platform) criteria.platform = String(req.query.platform);
  if (req.query.category) criteria.category = String(req.query.category);
  const typeFilter = req.query.type || req.query.contentType;
  if (typeFilter) criteria.type = String(typeFilter);
  const campaignFilter = req.query.campaign || req.query.campaignId;
  if (campaignFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(campaignFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.campaign = String(campaignFilter);
  }
  if (req.query.media) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.media))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.media = String(req.query.media);
  }
  if (req.query.assignedTo) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.assignedTo))) {
      throw new ApiError(400, 'Invalid assignee filter.');
    }
    criteria.assignedTo = String(req.query.assignedTo);
  }
  if (req.query.from || req.query.to) {
    criteria.publishDate = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      if (!Number.isFinite(+from)) throw new ApiError(400, 'Invalid start date.');
      criteria.publishDate.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (!Number.isFinite(+to)) throw new ApiError(400, 'Invalid end date.');
      criteria.publishDate.$lte = to;
    }
  }
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
  const rawSort = String(req.query.sort || '-createdAt');
  const sortField = rawSort.replace(/^-/, '');
  const sort = CONTENT_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
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
export async function getContentById(req, contentId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const content = await findByIdWithinOrganization(contentId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!content) throw new ApiError(404, 'Record not found.');
  return content;
}
export async function getContentRelatedRecords(req, contentId) {
  const content = await getContentById(req, contentId);
  const scopeFilter = tenantScope(req);
  const groups = await Promise.all(
    Object.entries(resources)
      .filter(([, config]) => config.fields.some((f) => f.key === 'content'))
      .map(async ([key, config]) => {
        const filter = { ...scopeFilter, content: content._id };
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
export async function createContent(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyContentRelationsAndAssignee(data, req.organizationId, ownerId);
  const content = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Created ${content.title}`, 'content', content._id);
  return content;
}
export async function updateContent(req, contentId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const content = await findByIdWithinOrganization(contentId, req.organizationId, ownerId);
  if (!content) throw new ApiError(404, 'Record not found.');
  await verifyContentRelationsAndAssignee(data, req.organizationId, ownerId);
  Object.assign(content, data);
  content.updatedBy = req.user._id;
  for (const field of CLEARABLE_FIELDS) {
    if (rawBody[field] === '') {
      content.set(field, undefined);
      if (field === 'campaign' || field === 'campaignId') {
        content.set('campaign', undefined);
        content.set('campaignId', undefined);
      }
      if (field === 'publishDate' || field === 'dueDate') {
        content.set('publishDate', undefined);
        content.set('dueDate', undefined);
      }
    }
  }
  await content.save();
  await recordActivity(req, `Updated ${content.title}`, 'content', content._id);
  return content;
}
export async function archiveContent(req, contentId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const content = await archiveWithinOrganization(
    contentId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!content) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${content.title}`, 'content', content._id);
  return content;
}
export async function duplicateContent(req, contentId) {
  const original = await getContentById(req, contentId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  data.title = `${original.title} (copy)`;
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Duplicated ${original.title}`, 'content', copy._id);
  return copy;
}
export async function restoreContent(req, contentId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const content = await restoreWithinOrganization(
    contentId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!content) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${content.title}`, 'content', content._id);
  return content;
}
