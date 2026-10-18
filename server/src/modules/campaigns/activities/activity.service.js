import { CampaignActivity } from './activity.model.js';
export async function logCampaignActivity({ organizationId, campaignId, actorId, action, metadata = {} }) {
  try {
    return await CampaignActivity.create({
      organizationId,
      campaignId,
      actorId,
      action,
      metadata,
    });
  } catch (err) {
    console.error('Failed to log campaign activity:', err);
    return null;
  }
}
export async function listCampaignActivities(req, campaignId) {
  const items = await CampaignActivity.find({
    organizationId: req.organizationId,
    campaignId,
  })
    .sort({ createdAt: -1 })
    .populate('actorId', 'name email avatar')
    .lean();
  return { items, total: items.length };
}
