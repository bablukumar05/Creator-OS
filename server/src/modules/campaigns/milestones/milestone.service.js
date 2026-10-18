import { Milestone } from './milestone.model.js';
import { Campaign } from '../campaign.model.js';
import { logCampaignActivity } from '../activities/activity.service.js';
import { ApiError } from '../../../../utils/http.js';
import { z } from 'zod';
import { MILESTONE_STATUSES } from '../campaign.constants.js';
const milestonePayloadSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  dueDate: z.iso.date().optional(),
  status: z.enum(MILESTONE_STATUSES).optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
});
export async function listMilestones(req, campaignId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const items = await Milestone.find({
    campaignId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();
  return { items, total: items.length };
}
export async function createMilestone(req, campaignId, body) {
  const payload = milestonePayloadSchema.parse(body);
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await Campaign.findOne({
    _id: campaignId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!campaign) throw new ApiError(404, 'Campaign not found.');
  const milestone = await Milestone.create({
    organizationId: req.organizationId,
    owner: ownerId,
    campaignId: campaign._id,
    title: payload.title,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    status: payload.status || 'Pending',
    progress: payload.progress || 0,
    createdBy: req.user._id,
  });
  await logCampaignActivity({
    organizationId: req.organizationId,
    campaignId: campaign._id,
    actorId: req.user._id,
    action: `Milestone Created: "${milestone.title}"`,
    metadata: { milestoneId: milestone._id },
  });
  return milestone;
}
export async function updateMilestone(req, campaignId, milestoneId, body) {
  const payload = milestonePayloadSchema.partial().parse(body);
  const ownerId = req.organization?.ownerId || req.user._id;
  const milestone = await Milestone.findOne({
    _id: milestoneId,
    campaignId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  Object.assign(milestone, payload);
  if (payload.status === 'Completed' && typeof payload.progress !== 'number') {
    milestone.progress = 100;
  }
  await milestone.save();
  return milestone;
}
export async function deleteMilestone(req, campaignId, milestoneId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const milestone = await Milestone.findOneAndDelete({
    _id: milestoneId,
    campaignId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  return { success: true, message: 'Milestone deleted.' };
}
