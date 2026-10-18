import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './content.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const contentRouter = Router();
contentRouter.use(authenticate, requireOrganization);
contentRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
contentRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.create));
contentRouter.get(
  '/:id/related',
  requirePermission(PERMISSIONS.CONTENT_READ),
  asyncRoute(controller.related),
);
contentRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.remove));
contentRouter.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  asyncRoute(controller.duplicate),
);
contentRouter.post(
  '/:id/restore',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  asyncRoute(controller.restore),
);
