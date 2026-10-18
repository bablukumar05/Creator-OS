import {
  getResourcePermission,
  hasAllPermissions,
  hasAnyPermission,
} from '../modules/roles/role.service.js';
import { ApiError } from '../../utils/http.js';
export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.membership || req.membership.status !== 'active') {
      return next(new ApiError(403, 'Active organization membership is required.'));
    }
    if (!allowedRoles.includes(req.membership.role)) {
      return next(new ApiError(403, 'You do not have the required role for this action.'));
    }
    return next();
  };
export const requirePermission =
  (...requiredPermissions) =>
  (req, res, next) => {
    if (!req.membership || req.membership.status !== 'active') {
      return next(new ApiError(403, 'Active organization membership is required.'));
    }
    if (!hasAllPermissions(req.membership, requiredPermissions)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
export const requireAnyPermission =
  (...candidatePermissions) =>
  (req, res, next) => {
    if (!req.membership || req.membership.status !== 'active') {
      return next(new ApiError(403, 'Active organization membership is required.'));
    }
    if (!hasAnyPermission(req.membership, candidatePermissions)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
export const requireResourcePermission =
  (action = 'read') =>
  (req, res, next) => {
    if (!req.membership || req.membership.status !== 'active') {
      return next(new ApiError(403, 'Active organization membership is required.'));
    }
    const permission = getResourcePermission(req.resource, action);
    if (!permission) {
      return next();
    }
    if (!hasAllPermissions(req.membership, [permission])) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
