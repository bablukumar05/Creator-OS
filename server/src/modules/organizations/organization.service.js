import crypto from 'node:crypto';
import { slugifyOrganizationName } from './organization.types.js';
import {
  bindSessionOrganization,
  createOrganizationRecord,
  findActiveOrganizationById,
  findActiveOrganizationsByIds,
  slugExists,
} from './organization.repository.js';
import {
  createMembership,
  findActiveMembership,
  findActiveMembershipsByUser,
  touchMembership,
} from '../members/member.repository.js';
import { ApiError } from '../../../utils/http.js';
export function safeOrganization(organization, membership = null, activeOrganizationId = null) {
  if (!organization) return null;
  const plain = typeof organization.toObject === 'function' ? organization.toObject() : organization;
  return {
    _id: plain._id,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    ownerId: plain.ownerId,
    logo: plain.logo || '',
    description: plain.description || '',
    website: plain.website || '',
    settings: plain.settings,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    current: activeOrganizationId ? String(plain._id) === String(activeOrganizationId) : undefined,
    membership: membership
      ? {
          _id: membership._id,
          role: membership.role,
          status: membership.status,
          permissions: membership.permissions || [],
          joinedAt: membership.joinedAt,
          lastActiveAt: membership.lastActiveAt,
        }
      : undefined,
  };
}
export async function generateUniqueSlug(name, preferredSlug) {
  const base = slugifyOrganizationName(preferredSlug || name) || 'workspace';
  if (!(await slugExists(base))) return base;
  if (preferredSlug) {
    throw new ApiError(409, 'This workspace slug is already taken.');
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `${base.slice(0, 72)}-${crypto.randomBytes(2).toString('hex')}`;
    if (!(await slugExists(candidate))) return candidate;
  }
  return `${base.slice(0, 68)}-${Date.now().toString(36)}`;
}
export async function createOrganization(user, payload, currentSession = null) {
  const slug = await generateUniqueSlug(payload.name, payload.slug);
  const organization = await createOrganizationRecord({
    name: payload.name,
    slug,
    type: payload.type || 'creator_workspace',
    ownerId: user._id,
    createdBy: user._id,
    logo: payload.logo || undefined,
    description: payload.description || undefined,
    website: payload.website || undefined,
    settings: payload.settings || {},
  });
  const membership = await createMembership({
    organizationId: organization._id,
    userId: user._id,
    email: user.email,
    role: 'owner',
    status: 'active',
    joinedAt: new Date(),
    lastActiveAt: new Date(),
  });
  if (currentSession?._id) {
    await bindSessionOrganization(currentSession._id, user._id, organization._id);
    currentSession.activeOrganizationId = organization._id;
  }
  return {
    organization: safeOrganization(organization, membership, organization._id),
    membership,
  };
}
export async function ensureDefaultOrganization(user, currentSession = null) {
  const memberships = await findActiveMembershipsByUser(user._id);
  const organizations = await findActiveOrganizationsByIds(
    memberships.map((item) => item.organizationId),
  );
  const orgMap = new Map(organizations.map((org) => [String(org._id), org]));
  const validMemberships = memberships.filter((item) => orgMap.has(String(item.organizationId)));
  if (!validMemberships.length) {
    const defaultName = user.name ? `${user.name}'s Workspace` : 'Creator Workspace';
    return createOrganization(
      user,
      { name: defaultName, type: 'creator_workspace' },
      currentSession,
    );
  }
  const sessionOrgId = currentSession?.activeOrganizationId
    ? String(currentSession.activeOrganizationId)
    : null;
  const matchedMembership =
    (sessionOrgId &&
      validMemberships.find((item) => String(item.organizationId) === sessionOrgId)) ||
    validMemberships[0];
  const activeOrg = orgMap.get(String(matchedMembership.organizationId));
  if (currentSession?._id && String(currentSession.activeOrganizationId) !== String(activeOrg._id)) {
    await bindSessionOrganization(currentSession._id, user._id, activeOrg._id);
    currentSession.activeOrganizationId = activeOrg._id;
  }
  return {
    organization: safeOrganization(activeOrg, matchedMembership, activeOrg._id),
    membership: matchedMembership,
  };
}
export async function listUserOrganizations(user, currentSession = null) {
  const { organization: currentOrg } = await ensureDefaultOrganization(user, currentSession);
  const activeOrganizationId = currentSession?.activeOrganizationId || currentOrg._id;
  const memberships = await findActiveMembershipsByUser(user._id);
  const organizations = await findActiveOrganizationsByIds(
    memberships.map((item) => item.organizationId),
  );
  const orgMap = new Map(organizations.map((org) => [String(org._id), org]));
  const items = memberships
    .map((membership) => {
      const org = orgMap.get(String(membership.organizationId));
      return org ? safeOrganization(org, membership, activeOrganizationId) : null;
    })
    .filter(Boolean);
  return {
    activeOrganizationId,
    items,
  };
}
export async function getCurrentOrganization(user, currentSession = null) {
  return ensureDefaultOrganization(user, currentSession);
}
export async function switchOrganization(user, targetOrganizationId, currentSession) {
  const [organization, membership] = await Promise.all([
    findActiveOrganizationById(targetOrganizationId),
    findActiveMembership(user._id, targetOrganizationId),
  ]);
  if (!organization || !membership) {
    throw new ApiError(403, 'You do not have access to this organization.');
  }
  await Promise.all([
    bindSessionOrganization(currentSession?._id, user._id, organization._id),
    touchMembership(membership._id),
  ]);
  if (currentSession) {
    currentSession.activeOrganizationId = organization._id;
  }
  return {
    organization: safeOrganization(organization, membership, organization._id),
    membership: {
      _id: membership._id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      permissions: membership.permissions || [],
      joinedAt: membership.joinedAt,
      lastActiveAt: new Date(),
    },
  };
}
export async function updateCurrentOrganization(user, payload, currentSession) {
  const { organization, membership } = await ensureDefaultOrganization(user, currentSession);
  if (membership.role !== 'owner') {
    throw new ApiError(403, 'Only organization owners can modify organization settings.');
  }
  const updates = {};
  if (payload.name) updates.name = payload.name;
  if (payload.logo !== undefined) updates.logo = payload.logo;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.website !== undefined) updates.website = payload.website;
  if (payload.settings) updates.settings = { ...organization.settings, ...payload.settings };
  if (payload.status) updates.status = payload.status;
  const { Organization } = await import('./organization.model.js');
  const updatedOrg = await Organization.findByIdAndUpdate(
    organization._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  return safeOrganization(updatedOrg, membership, updatedOrg._id);
}
