import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './brief.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const briefRouter = Router();
briefRouter.use(authenticate, requireOrganization);
briefRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
briefRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.create));
briefRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.remove));
