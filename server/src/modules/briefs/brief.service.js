import { Brief } from './brief.model.js';
import { findByIdWithinOrganization as findCampaignById } from '../campaigns/campaign.repository.js';
import { findByIdWithinOrganization as findContentById } from '../content/content.repository.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError } from '../../../utils/http.js';
async function verifyBriefRelations(data, organizationId, ownerId) {
  const targetCampaignId = data.campaign || data.campaignId;
  if (targetCampaignId) {
    const campaign = await findCampaignById(targetCampaignId, organizationId, ownerId, { lean: true });
    if (!campaign) throw new ApiError(400, 'Select a valid campaign from your workspace.');
    data.campaign = campaign._id;
    data.campaignId = campaign._id;
  }
  const targetContentId = data.content || data.contentId;
  if (targetContentId) {
    const content = await findContentById(targetContentId, organizationId, ownerId, { lean: true });
    if (!content) throw new ApiError(400, 'Select a valid content item from your workspace.');
    data.content = content._id;
    data.contentId = content._id;
  }
}
export async function listBriefs(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };
  if (req.query.campaignId) criteria.campaignId = req.query.campaignId;
  if (req.query.contentId) criteria.contentId = req.query.contentId;
  const items = await Brief.find(criteria)
    .sort({ createdAt: -1 })
    .populate('campaignId', 'name title')
    .populate('contentId', 'title contentType')
    .lean();
  return { items, total: items.length };
}
export async function getBriefById(req, briefId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brief = await Brief.findOne({
    _id: briefId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  }).lean();
  if (!brief) throw new ApiError(404, 'Brief not found.');
  return brief;
}
export async function createBrief(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyBriefRelations(data, req.organizationId, ownerId);
  const brief = await Brief.create({
    ...data,
    organizationId: req.organizationId,
    owner: ownerId,
    createdBy: req.user._id,
  });
  await recordActivity(req, `Created Brief: ${brief.title}`, 'briefs', brief._id);
  return brief;
}
export async function updateBrief(req, briefId, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brief = await Brief.findOne({
    _id: briefId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  });
  if (!brief) throw new ApiError(404, 'Brief not found.');
  await verifyBriefRelations(data, req.organizationId, ownerId);
  Object.assign(brief, data);
  brief.updatedBy = req.user._id;
  await brief.save();
  await recordActivity(req, `Updated Brief: ${brief.title}`, 'briefs', brief._id);
  return brief;
}
export async function archiveBrief(req, briefId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brief = await Brief.findOneAndUpdate(
    { _id: briefId, $or: [{ organizationId: req.organizationId }, { owner: ownerId }], deletedAt: null },
    { $set: { deletedAt: new Date(), updatedBy: req.user._id } },
    { new: true },
  );
  if (!brief) throw new ApiError(404, 'Brief not found.');
  await recordActivity(req, `Archived Brief: ${brief.title}`, 'briefs', brief._id);
  return brief;
}
