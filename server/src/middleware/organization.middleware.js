import {
  findActiveOrganizationById,
} from '../modules/organizations/organization.repository.js';
import {
  ensureDefaultOrganization,
  safeOrganization,
} from '../modules/organizations/organization.service.js';
import { findActiveMembership } from '../modules/members/member.repository.js';
import { resolveMemberPermissions } from '../modules/roles/role.service.js';
import { ApiError, asyncRoute } from '../../utils/http.js';
export function tenantScope(req, { includeDeleted = false } = {}) {
  const deletedAt = includeDeleted ? { $ne: null } : null;
  if (!req.organizationId) {
    return { owner: req.user._id, deletedAt };
  }
  const ownerId = req.organization?.ownerId || req.user._id;
  return {
    $or: [
      { organizationId: req.organizationId },
      { organizationId: null, owner: ownerId },
    ],
    deletedAt,
  };
}
export const requireOrganization = asyncRoute(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Please sign in to continue.');
  }
  if (req.query?.organizationId !== undefined) {
    throw new ApiError(
      400,
      'Organization context is resolved from your active session, not query parameters.',
    );
  }
  if (req.body && typeof req.body === 'object' && req.body.organizationId !== undefined) {
    throw new ApiError(
      400,
      'Organization context is resolved from your active session, not request body.',
    );
  }
  let organization;
  let membership;
  if (req.session?.activeOrganizationId) {
    const [activeOrg, activeMember] = await Promise.all([
      findActiveOrganizationById(req.session.activeOrganizationId),
      findActiveMembership(req.user._id, req.session.activeOrganizationId),
    ]);
    if (!activeOrg || !activeMember) {
      throw new ApiError(403, 'You do not have access to this organization.');
    }
    organization = safeOrganization(activeOrg, activeMember, activeOrg._id);
    membership = typeof activeMember.toObject === 'function' ? activeMember.toObject() : activeMember;
  } else {
    const resolved = await ensureDefaultOrganization(req.user, req.session);
    organization = resolved.organization;
    membership =
      typeof resolved.membership.toObject === 'function'
        ? resolved.membership.toObject()
        : resolved.membership;
  }
  req.organization = organization;
  req.organizationId = organization._id;
  req.membership = {
    ...membership,
    effectivePermissions: resolveMemberPermissions(membership),
  };
  next();
});
