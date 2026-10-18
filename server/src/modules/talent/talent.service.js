import { TalentMembership } from './talent.model.js';
import { CreatorProfile } from '../creators/creator.model.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError } from '../../../utils/http.js';
export async function listTalentRoster(req) {
  const items = await TalentMembership.find({
    organizationId: req.organizationId,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .populate('creatorId', 'displayName username categories rating availabilityStatus profileImage')
    .populate('managerId', 'name email')
    .lean();
  return { items, total: items.length };
}
export async function getTalentById(req, talentId) {
  const item = await TalentMembership.findOne({
    _id: talentId,
    organizationId: req.organizationId,
    deletedAt: null,
  })
    .populate('creatorId')
    .populate('managerId', 'name email')
    .lean();
  if (!item) throw new ApiError(404, 'Talent roster entry not found.');
  return item;
}
export async function addTalentToRoster(req, data) {
  const creator = await CreatorProfile.findById(data.creatorId);
  if (!creator) throw new ApiError(400, 'Select a valid creator profile.');
  const exists = await TalentMembership.exists({
    organizationId: req.organizationId,
    creatorId: creator._id,
    deletedAt: null,
  });
  if (exists) throw new ApiError(409, 'Creator is already in your talent roster.');
  const item = await TalentMembership.create({
    ...data,
    organizationId: req.organizationId,
    creatorId: creator._id,
    createdBy: req.user._id,
  });
  await recordActivity(req, `Added ${creator.displayName} to Talent Roster`, 'talent', item._id);
  return item;
}
export async function updateTalentRoster(req, talentId, data) {
  const item = await TalentMembership.findOne({
    _id: talentId,
    organizationId: req.organizationId,
    deletedAt: null,
  });
  if (!item) throw new ApiError(404, 'Talent roster entry not found.');
  Object.assign(item, data);
  await item.save();
  await recordActivity(req, `Updated Talent Roster entry`, 'talent', item._id);
  return item;
}
export async function removeTalentFromRoster(req, talentId) {
  const item = await TalentMembership.findOneAndUpdate(
    { _id: talentId, organizationId: req.organizationId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
  if (!item) throw new ApiError(404, 'Talent roster entry not found.');
  await recordActivity(req, `Removed creator from Talent Roster`, 'talent', item._id);
  return item;
}
