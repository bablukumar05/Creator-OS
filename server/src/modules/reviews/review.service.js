import { Review } from './review.model.js';
import { findByIdWithinOrganization as findContentById } from '../content/content.repository.js';
import { Asset } from '../assets/asset.model.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError } from '../../../utils/http.js';
async function verifyReviewRelations(data, organizationId, ownerId) {
  const targetContentId = data.content || data.contentId;
  if (targetContentId) {
    const content = await findContentById(targetContentId, organizationId, ownerId, { lean: true });
    if (!content) throw new ApiError(400, 'Select a valid content item from your workspace.');
    data.content = content._id;
    data.contentId = content._id;
  }
  const targetAssetId = data.asset || data.assetId;
  if (targetAssetId) {
    const asset = await Asset.findOne({
      _id: targetAssetId,
      $or: [{ organizationId }, { owner: ownerId }],
      deletedAt: null,
    });
    if (!asset) throw new ApiError(400, 'Select a valid media asset from your workspace.');
    data.asset = asset._id;
    data.assetId = asset._id;
  }
}
export async function listReviews(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };
  if (req.query.contentId) criteria.contentId = req.query.contentId;
  if (req.query.assetId) criteria.assetId = req.query.assetId;
  if (req.query.status) criteria.status = req.query.status;
  const items = await Review.find(criteria)
    .sort({ timestamp: 1, createdAt: -1 })
    .populate('reviewerId', 'name email avatar')
    .lean();
  return { items, total: items.length };
}
export async function getReviewById(req, reviewId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const review = await Review.findOne({
    _id: reviewId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  }).lean();
  if (!review) throw new ApiError(404, 'Review note not found.');
  return review;
}
export async function createReview(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyReviewRelations(data, req.organizationId, ownerId);
  const seconds = Number(data.timestamp || 0);
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  const timecodeFormatted = data.timecodeFormatted || `${mins}:${secs}`;

  const review = await Review.create({
    ...data,
    timecodeFormatted,
    authorName: req.user?.name || 'Reviewer',
    organizationId: req.organizationId,
    owner: ownerId,
    reviewerId: req.user._id,
  });

  const io = req.app.get('io');
  if (io && req.organizationId) {
    io.to(`org:${req.organizationId}`).emit('review-created', {
      reviewId: review._id,
      timestamp: review.timestamp,
      comment: review.comment,
      authorName: review.authorName,
      timecodeFormatted: review.timecodeFormatted,
    });
  }

  await recordActivity(req, `Added review note at ${timecodeFormatted}`, 'reviews', review._id);
  return review;
}
export async function updateReview(req, reviewId, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const review = await Review.findOne({
    _id: reviewId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  });
  if (!review) throw new ApiError(404, 'Review note not found.');
  await verifyReviewRelations(data, req.organizationId, ownerId);
  Object.assign(review, data);
  await review.save();
  await recordActivity(req, `Updated review note status to ${review.status}`, 'reviews', review._id);
  return review;
}
export async function toggleResolveReview(req, reviewId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const review = await Review.findOne({
    _id: reviewId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  });
  if (!review) throw new ApiError(404, 'Review note not found.');

  review.resolved = !review.resolved;
  review.resolvedAt = review.resolved ? new Date() : null;
  review.resolvedBy = review.resolved ? req.user._id : null;
  review.status = review.resolved ? 'Resolved' : 'Pending';

  await review.save();

  const io = req.app.get('io');
  if (io && req.organizationId) {
    io.to(`org:${req.organizationId}`).emit('review-status-changed', {
      reviewId: review._id,
      resolved: review.resolved,
      status: review.status,
    });
  }

  await recordActivity(req, `Marked review as ${review.status}`, 'reviews', review._id);
  return review;
}
export async function archiveReview(req, reviewId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, $or: [{ organizationId: req.organizationId }, { owner: ownerId }], deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
  if (!review) throw new ApiError(404, 'Review note not found.');
  await recordActivity(req, `Archived review note`, 'reviews', review._id);
  return review;
}
