import crypto from 'node:crypto';
import { User } from '../auth/auth.model.js';
import {
  bindSessionOrganization,
  findActiveOrganizationById,
} from '../organizations/organization.repository.js';
import { safeOrganization } from '../organizations/organization.service.js';
import {
  createMembership,
  findInvitedMembershipByTokenHash,
  findMembershipByEmailInOrganization,
  findMembershipByIdInOrganization,
  findMembershipByUserInOrganization,
  listMembersByOrganization,
} from './member.repository.js';
import { resolveMemberPermissions } from '../roles/role.service.js';
import { hashToken } from '../../../services/otpService.js';
import { ApiError } from '../../../utils/http.js';
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export function safeMember(member) {
  if (!member) return null;
  const plain = typeof member.toObject === 'function' ? member.toObject() : member;
  const populatedUser =
    plain.userId && typeof plain.userId === 'object' && plain.userId._id ? plain.userId : null;
  const populatedInviter =
    plain.invitedBy && typeof plain.invitedBy === 'object' && plain.invitedBy._id
      ? plain.invitedBy
      : null;
  return {
    _id: plain._id,
    organizationId: plain.organizationId,
    userId: populatedUser ? populatedUser._id : plain.userId,
    email: plain.email || populatedUser?.email || '',
    name: populatedUser?.name || '',
    avatar: populatedUser?.avatar || '',
    role: plain.role,
    status: plain.status,
    permissions: plain.permissions || [],
    effectivePermissions: resolveMemberPermissions(plain),
    invitedBy: populatedInviter
      ? { _id: populatedInviter._id, name: populatedInviter.name, email: populatedInviter.email }
      : plain.invitedBy,
    inviteExpiresAt: plain.inviteExpiresAt || null,
    joinedAt: plain.joinedAt,
    lastActiveAt: plain.lastActiveAt,
    createdAt: plain.createdAt,
  };
}
export async function listOrganizationMembers(organizationId) {
  const items = await listMembersByOrganization(organizationId);
  return {
    items: items.map(safeMember),
    total: items.length,
  };
}
export async function inviteMember(organization, actorUser, payload) {
  const email = payload.email.trim().toLowerCase();
  const existingUser = await User.findOne({ email }).select('_id email name');
  const existingMembership =
    (existingUser &&
      (await findMembershipByUserInOrganization(existingUser._id, organization._id))) ||
    (await findMembershipByEmailInOrganization(email, organization._id));
  if (existingMembership && existingMembership.status === 'active') {
    throw new ApiError(409, 'This user is already an active member of the organization.');
  }
  const rawToken = crypto.randomBytes(32).toString('hex');
  const inviteTokenHash = hashToken(rawToken);
  const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
  let member;
  if (existingMembership) {
    existingMembership.userId = existingUser?._id || existingMembership.userId || null;
    existingMembership.email = email;
    existingMembership.role = payload.role;
    existingMembership.permissions = payload.permissions || [];
    existingMembership.status = 'invited';
    existingMembership.invitedBy = actorUser._id;
    existingMembership.inviteTokenHash = inviteTokenHash;
    existingMembership.inviteExpiresAt = inviteExpiresAt;
    member = await existingMembership.save();
  } else {
    member = await createMembership({
      organizationId: organization._id,
      userId: existingUser?._id || null,
      email,
      role: payload.role,
      permissions: payload.permissions || [],
      status: 'invited',
      invitedBy: actorUser._id,
      inviteTokenHash,
      inviteExpiresAt,
    });
  }
  return {
    member: safeMember(member),
    inviteToken: rawToken,
  };
}
export async function acceptInvitation(user, rawToken, currentSession = null) {
  const tokenHash = hashToken(rawToken);
  const invitation = await findInvitedMembershipByTokenHash(tokenHash);
  if (!invitation) {
    throw new ApiError(400, 'Invitation is invalid or has expired.');
  }
  if (!user.email || user.email.toLowerCase() !== String(invitation.email).toLowerCase()) {
    throw new ApiError(403, 'This invitation was issued for a different email address.');
  }
  const organization = await findActiveOrganizationById(invitation.organizationId);
  if (!organization) {
    throw new ApiError(404, 'Organization is no longer available.');
  }
  invitation.userId = user._id;
  invitation.status = 'active';
  invitation.inviteTokenHash = undefined;
  invitation.inviteExpiresAt = null;
  invitation.joinedAt = new Date();
  invitation.lastActiveAt = new Date();
  await invitation.save();
  if (currentSession?._id) {
    await bindSessionOrganization(currentSession._id, user._id, organization._id);
    currentSession.activeOrganizationId = organization._id;
  }
  return {
    organization: safeOrganization(organization, invitation, organization._id),
    membership: safeMember(invitation),
  };
}
export async function updateOrganizationMember(organizationId, targetMemberId, updates) {
  const member = await findMembershipByIdInOrganization(targetMemberId, organizationId);
  if (!member) {
    throw new ApiError(404, 'Member not found.');
  }
  if (member.role === 'owner') {
    throw new ApiError(403, 'The organization owner membership cannot be modified or demoted.');
  }
  if (updates.role !== undefined) member.role = updates.role;
  if (updates.status !== undefined) member.status = updates.status;
  if (updates.permissions !== undefined) member.permissions = updates.permissions;
  await member.save();
  return safeMember(member);
}
export async function removeOrganizationMember(organizationId, targetMemberId) {
  const member = await findMembershipByIdInOrganization(targetMemberId, organizationId);
  if (!member) {
    throw new ApiError(404, 'Member not found.');
  }
  if (member.role === 'owner') {
    throw new ApiError(403, 'The organization owner cannot be removed.');
  }
  member.status = 'removed';
  member.inviteTokenHash = undefined;
  member.inviteExpiresAt = null;
  await member.save();
  return safeMember(member);
}
