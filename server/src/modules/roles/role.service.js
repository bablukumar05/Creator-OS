import {
  ALL_PERMISSIONS,
  RESOURCE_PERMISSION_MAP,
  ROLE_METADATA,
  ROLE_PERMISSIONS,
} from './role.types.js';
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}
export function resolveMemberPermissions(membership) {
  if (!membership || membership.status !== 'active') return [];
  const basePermissions = getPermissionsForRole(membership.role);
  const customPermissions = Array.isArray(membership.permissions)
    ? membership.permissions.filter((perm) => ALL_PERMISSIONS.includes(perm))
    : [];
  return Array.from(new Set([...basePermissions, ...customPermissions]));
}
export function hasPermission(membership, requiredPermission) {
  if (!membership || membership.status !== 'active') return false;
  if (membership.role === 'owner') return true;
  const effective =
    membership.effectivePermissions || resolveMemberPermissions(membership);
  return effective.includes(requiredPermission);
}
export function hasAllPermissions(membership, requiredPermissions = []) {
  return requiredPermissions.every((permission) => hasPermission(membership, permission));
}
export function hasAnyPermission(membership, candidatePermissions = []) {
  return candidatePermissions.some((permission) => hasPermission(membership, permission));
}
export function getResourcePermission(resourceKey, action = 'read') {
  const entry = RESOURCE_PERMISSION_MAP[resourceKey];
  if (!entry) return null;
  return action === 'write' ? entry.write : entry.read;
}
export function listRoles() {
  return Object.values(ROLE_METADATA).map((meta) => ({
    ...meta,
    permissions: getPermissionsForRole(meta.key),
  }));
}
