import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './deal.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const dealRouter = Router();
dealRouter.use(authenticate, requireOrganization);
dealRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
dealRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.DEAL_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.DEAL_WRITE), asyncRoute(controller.create));
dealRouter.get(
  '/:id/related',
  requirePermission(PERMISSIONS.DEAL_READ),
  asyncRoute(controller.related),
);
dealRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.DEAL_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.DEAL_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.DEAL_WRITE), asyncRoute(controller.remove));
dealRouter.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.DEAL_WRITE),
  asyncRoute(controller.duplicate),
);
dealRouter.post(
  '/:id/restore',
  requirePermission(PERMISSIONS.DEAL_WRITE),
  asyncRoute(controller.restore),
);
