import { Member } from './member.model.js';
export async function createMembership(data) {
  return Member.create(data);
}
export async function findActiveMembership(userId, organizationId) {
  return Member.findOne({
    userId,
    organizationId,
    status: 'active',
  });
}
export async function findMembershipByIdInOrganization(memberId, organizationId) {
  return Member.findOne({
    _id: memberId,
    organizationId,
    status: { $ne: 'removed' },
  });
}
export async function findMembershipByEmailInOrganization(email, organizationId) {
  return Member.findOne({
    organizationId,
    email: String(email).trim().toLowerCase(),
  });
}
export async function findMembershipByUserInOrganization(userId, organizationId) {
  return Member.findOne({
    organizationId,
    userId,
  });
}
export async function findInvitedMembershipByTokenHash(inviteTokenHash) {
  return Member.findOne({
    inviteTokenHash,
    status: 'invited',
    inviteExpiresAt: { $gt: new Date() },
  }).select('+inviteTokenHash');
}
export async function listMembersByOrganization(organizationId) {
  return Member.find({
    organizationId,
    status: { $ne: 'removed' },
  })
    .populate('userId', 'name email avatar')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: 1 })
    .lean();
}
export async function findActiveMembershipsByUser(userId) {
  return Member.find({
    userId,
    status: 'active',
  })
    .sort({ lastActiveAt: -1, createdAt: 1 })
    .lean();
}
export async function touchMembership(memberId) {
  return Member.findByIdAndUpdate(
    memberId,
    { $set: { lastActiveAt: new Date() } },
    { new: true },
  );
}
export async function deleteMembershipsByUser(userId) {
  return Member.deleteMany({ userId });
}
