import { Deliverable } from './deliverable.model.js';
import { Campaign } from '../campaign.model.js';
import { logCampaignActivity } from '../activities/activity.service.js';
import { ApiError } from '../../../../utils/http.js';
export async function listDeliverables(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaignId = req.params.campaignId || req.query.campaignId;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  };
  if (campaignId) criteria.campaignId = campaignId;
  if (req.query.creatorId) criteria.creatorId = req.query.creatorId;
  if (req.query.platform) criteria.platform = String(req.query.platform);
  if (req.query.status) criteria.status = String(req.query.status);
  const items = await Deliverable.find(criteria)
    .sort({ dueDate: 1, createdAt: -1 })
    .populate('creatorId', 'name email avatar')
    .populate('campaignId', 'name title status')
    .lean();
  return { items, total: items.length };
}
export async function getOverdueDeliverables(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const items = await Deliverable.find({
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    dueDate: { $lt: startOfToday },
    status: { $nin: ['Approved', 'Published'] },
  })
    .sort({ dueDate: 1 })
    .populate('campaignId', 'name title')
    .populate('creatorId', 'name email')
    .lean();
  return { items, total: items.length };
}
export async function getDeliverableById(req, delivId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const item = await Deliverable.findOne({
    _id: delivId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  }).lean();
  if (!item) throw new ApiError(404, 'Deliverable not found.');
  return item;
}
export async function createDeliverable(req, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await Campaign.findOne({
    _id: payload.campaignId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!campaign) throw new ApiError(404, 'Campaign not found.');
  const deliverable = await Deliverable.create({
    ...payload,
    organizationId: req.organizationId,
    owner: ownerId,
    createdBy: req.user._id,
  });
  await logCampaignActivity({
    organizationId: req.organizationId,
    campaignId: campaign._id,
    actorId: req.user._id,
    action: `Deliverable Created: ${deliverable.title}`,
    metadata: { deliverableId: deliverable._id, platform: deliverable.platform, contentType: deliverable.contentType },
  });
  await recalculateCampaignProgress(campaign._id);
  return deliverable;
}
export async function updateDeliverable(req, delivId, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const deliverable = await Deliverable.findOne({
    _id: delivId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!deliverable) throw new ApiError(404, 'Deliverable not found.');
  const oldStatus = deliverable.status;
  Object.assign(deliverable, payload);
  deliverable.updatedBy = req.user._id;
  await deliverable.save();
  if (payload.status && payload.status !== oldStatus) {
    await logCampaignActivity({
      organizationId: req.organizationId,
      campaignId: deliverable.campaignId,
      actorId: req.user._id,
      action: `Deliverable Status Changed (${deliverable.title}): ${oldStatus} → ${payload.status}`,
      metadata: { deliverableId: deliverable._id, from: oldStatus, to: payload.status },
    });
  }
  await recalculateCampaignProgress(deliverable.campaignId);
  return deliverable;
}
export async function deleteDeliverable(req, delivId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const deliverable = await Deliverable.findOneAndDelete({
    _id: delivId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!deliverable) throw new ApiError(404, 'Deliverable not found.');
  await recalculateCampaignProgress(deliverable.campaignId);
  return { success: true, message: 'Deliverable deleted.' };
}
export async function recalculateCampaignProgress(campaignId) {
  try {
    const total = await Deliverable.countDocuments({ campaignId });
    if (total === 0) return;
    const completed = await Deliverable.countDocuments({
      campaignId,
      status: { $in: ['Approved', 'Published'] },
    });
    const progress = Math.round((completed / total) * 100);
    await Campaign.updateOne({ _id: campaignId }, { $set: { progress } });
  } catch (err) {
    console.error('Failed to recalculate campaign progress:', err);
  }
}
