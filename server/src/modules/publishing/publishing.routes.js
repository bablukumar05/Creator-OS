import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './publishing.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const publishingRouter = Router();
publishingRouter.use(authenticate, requireOrganization);
publishingRouter.get(
  '/calendar',
  requirePermission(PERMISSIONS.CONTENT_READ),
  asyncRoute(controller.calendar),
);
publishingRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
publishingRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.create));
publishingRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.update));
