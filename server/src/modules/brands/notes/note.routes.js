import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './note.controller.js';
import { authenticate } from '../../../../middleware/auth.js';
import { requireOrganization } from '../../../middleware/organization.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../../utils/http.js';
export const noteRouter = Router({ mergeParams: true });
noteRouter.use(authenticate, requireOrganization);
noteRouter.param('noteId', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
noteRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.create));
noteRouter
  .route('/:noteId')
  .delete(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.remove));
