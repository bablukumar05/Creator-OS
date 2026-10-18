import { Activity } from './activity.model.js';
export async function logBrandActivity({ organizationId, brandId, actorId, action, metadata = {} }) {
  try {
    return await Activity.create({
      organizationId,
      brandId,
      actorId,
      action,
      metadata,
    });
  } catch (err) {
    console.error('Failed to log brand activity:', err);
    return null;
  }
}
export async function listBrandActivities(req, brandId) {
  const items = await Activity.find({
    organizationId: req.organizationId,
    brandId,
  })
    .sort({ createdAt: -1 })
    .populate('actorId', 'name email avatar')
    .lean();
  return { items, total: items.length };
}
