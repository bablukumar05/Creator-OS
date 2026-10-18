import { Publishing } from './publishing.model.js';
import { Content } from '../content/content.model.js';
import { findByIdWithinOrganization as findContentById } from '../content/content.repository.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError } from '../../../utils/http.js';
async function verifyPublishingRelations(data, organizationId, ownerId) {
  const targetContentId = data.content || data.contentId;
  if (targetContentId) {
    const content = await findContentById(targetContentId, organizationId, ownerId, { lean: true });
    if (!content) throw new ApiError(400, 'Select a valid content item from your workspace.');
    data.content = content._id;
    data.contentId = content._id;
    if (!data.platform && content.platform) data.platform = content.platform;
  }
}
export async function listPublishing(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };
  if (req.query.contentId) criteria.contentId = req.query.contentId;
  if (req.query.status) criteria.status = req.query.status;
  if (req.query.platform) criteria.platform = req.query.platform;
  if (req.query.from || req.query.to) {
    criteria.publishDate = {};
    if (req.query.from) criteria.publishDate.$gte = new Date(String(req.query.from));
    if (req.query.to) criteria.publishDate.$lte = new Date(String(req.query.to));
  }
  const items = await Publishing.find(criteria)
    .sort({ publishDate: 1 })
    .populate('contentId', 'title contentType platform status')
    .lean();
  return { items, total: items.length };
}
export async function getPublishingById(req, publishingId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const item = await Publishing.findOne({
    _id: publishingId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  }).lean();
  if (!item) throw new ApiError(404, 'Publishing record not found.');
  return item;
}
export async function createPublishing(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyPublishingRelations(data, req.organizationId, ownerId);
  const publishing = await Publishing.create({
    ...data,
    organizationId: req.organizationId,
    owner: ownerId,
    publisherId: req.user._id,
  });
  if (data.contentId) {
    const newStatus = data.status === 'Published' ? 'Published' : 'Scheduled';
    await Content.updateOne(
      { _id: data.contentId },
      { $set: { status: newStatus, publishDate: data.publishDate, publishedAt: data.status === 'Published' ? new Date() : undefined } },
    );
  }
  await recordActivity(req, `Scheduled Publishing for ${data.platform || 'Platform'}`, 'publishing', publishing._id);
  return publishing;
}
export async function updatePublishing(req, publishingId, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const item = await Publishing.findOne({
    _id: publishingId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  });
  if (!item) throw new ApiError(404, 'Publishing record not found.');
  await verifyPublishingRelations(data, req.organizationId, ownerId);
  Object.assign(item, data);
  await item.save();
  if (item.contentId && data.status) {
    const contentStatus = data.status === 'Published' ? 'Published' : data.status === 'Scheduled' ? 'Scheduled' : undefined;
    if (contentStatus) {
      await Content.updateOne({ _id: item.contentId }, { $set: { status: contentStatus } });
    }
  }
  await recordActivity(req, `Updated Publishing status to ${item.status}`, 'publishing', item._id);
  return item;
}
export async function getCalendar(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const filter = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };
  const [publishedEvents, contentItems] = await Promise.all([
    Publishing.find(filter).populate('contentId', 'title platform type contentType').lean(),
    Content.find(filter).select('title platform type contentType status publishDate dueDate').lean(),
  ]);
  return {
    events: publishedEvents,
    contentSchedule: contentItems.filter((c) => c.publishDate || c.dueDate),
  };
}
