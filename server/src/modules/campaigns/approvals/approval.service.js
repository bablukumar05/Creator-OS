import { Approval } from './approval.model.js';
import { Deliverable } from '../deliverables/deliverable.model.js';
import { logCampaignActivity } from '../activities/activity.service.js';
import { recalculateCampaignProgress } from '../deliverables/deliverable.service.js';
import { ApiError } from '../../../../utils/http.js';
export async function listApprovals(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaignId = req.params.campaignId || req.query.campaignId;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  };
  if (campaignId) criteria.campaignId = campaignId;
  if (req.query.deliverableId) criteria.deliverableId = req.query.deliverableId;
  if (req.query.status) criteria.status = String(req.query.status);
  const items = await Approval.find(criteria)
    .sort({ createdAt: -1 })
    .populate('deliverableId', 'title platform contentType status')
    .populate('submittedBy', 'name email avatar')
    .populate('reviewerId', 'name email avatar')
    .lean();
  return { items, total: items.length };
}
export async function getApprovalById(req, approvalId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const item = await Approval.findOne({
    _id: approvalId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  }).lean();
  if (!item) throw new ApiError(404, 'Approval record not found.');
  return item;
}
export async function createApproval(req, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const deliverable = await Deliverable.findOne({
    _id: payload.deliverableId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!deliverable) throw new ApiError(404, 'Deliverable not found.');
  const approval = await Approval.create({
    organizationId: req.organizationId,
    owner: ownerId,
    campaignId: deliverable.campaignId,
    deliverableId: deliverable._id,
    submittedBy: req.user._id,
    reviewerId: payload.reviewerId || null,
    status: 'Submitted',
    comments: payload.comments || '',
  });
  deliverable.status = 'Submitted';
  await deliverable.save();
  await logCampaignActivity({
    organizationId: req.organizationId,
    campaignId: deliverable.campaignId,
    actorId: req.user._id,
    action: `Approval Requested for "${deliverable.title}"`,
    metadata: { approvalId: approval._id, deliverableId: deliverable._id },
  });
  return approval;
}
export async function reviewApproval(req, approvalId, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const approval = await Approval.findOne({
    _id: approvalId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!approval) throw new ApiError(404, 'Approval record not found.');
  approval.status = payload.status;
  approval.reviewerId = req.user._id;
  approval.reviewedAt = new Date();
  if (payload.comments) approval.comments = payload.comments;
  await approval.save();
  const deliverable = await Deliverable.findById(approval.deliverableId);
  if (deliverable) {
    if (payload.status === 'Approved') {
      deliverable.status = 'Approved';
    } else if (payload.status === 'Needs Revision' || payload.status === 'Rejected') {
      deliverable.status = 'In Progress';
    }
    await deliverable.save();
    await recalculateCampaignProgress(deliverable.campaignId);
  }
  await logCampaignActivity({
    organizationId: req.organizationId,
    campaignId: approval.campaignId,
    actorId: req.user._id,
    action: `Approval Reviewed: Status set to ${payload.status}`,
    metadata: { approvalId: approval._id, status: payload.status, comments: payload.comments },
  });
  return approval;
}
