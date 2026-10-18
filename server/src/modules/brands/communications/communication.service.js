import { Communication } from './communication.model.js';
import { Brand } from '../brand.model.js';
import { logBrandActivity } from '../activities/activity.service.js';
import { ApiError } from '../../../../utils/http.js';
export async function listCommunications(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brandId = req.params.brandId || req.query.brandId;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  };
  if (brandId) criteria.brandId = brandId;
  if (req.query.type) criteria.type = String(req.query.type);
  if (req.query.dueFollowUp === 'true') {
    criteria.nextFollowUp = { $lte: new Date() };
  }
  const items = await Communication.find(criteria)
    .sort({ date: -1, createdAt: -1 })
    .populate('contactId', 'name email designation')
    .lean();
  return { items, total: items.length };
}
export async function getFollowUpsDue(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const items = await Communication.find({
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    nextFollowUp: { $ne: null, $lte: endOfDay },
  })
    .sort({ nextFollowUp: 1 })
    .populate('brandId', 'name title logo status')
    .populate('contactId', 'name email phone designation')
    .lean();
  return { items, total: items.length };
}
export async function getCommunicationById(req, commId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const comm = await Communication.findOne({
    _id: commId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  }).lean();
  if (!comm) throw new ApiError(404, 'Communication record not found.');
  return comm;
}
export async function createCommunication(req, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await Brand.findOne({
    _id: payload.brandId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!brand) throw new ApiError(404, 'Brand not found.');
  const comm = await Communication.create({
    ...payload,
    organizationId: req.organizationId,
    owner: ownerId,
    createdBy: req.user._id,
  });
  const action = comm.type === 'Meeting' || comm.type === 'Zoom' || comm.type === 'Google Meet'
    ? 'Meeting Logged'
    : 'Communication Logged';
  await logBrandActivity({
    organizationId: req.organizationId,
    brandId: brand._id,
    actorId: req.user._id,
    action,
    metadata: {
      communicationId: comm._id,
      type: comm.type,
      subject: comm.subject,
      nextFollowUp: comm.nextFollowUp,
    },
  });
  return comm;
}
export async function updateCommunication(req, commId, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const comm = await Communication.findOne({
    _id: commId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!comm) throw new ApiError(404, 'Communication record not found.');
  Object.assign(comm, payload);
  comm.updatedBy = req.user._id;
  await comm.save();
  return comm;
}
export async function deleteCommunication(req, commId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const comm = await Communication.findOneAndDelete({
    _id: commId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!comm) throw new ApiError(404, 'Communication record not found.');
  return { success: true, message: 'Communication record removed.' };
}
