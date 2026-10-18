import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './communication.controller.js';
import { authenticate } from '../../../../middleware/auth.js';
import { requireOrganization } from '../../../middleware/organization.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../../utils/http.js';
export const communicationRouter = Router({ mergeParams: true });
communicationRouter.use(authenticate, requireOrganization);
communicationRouter.get(
  '/follow-ups',
  requirePermission(PERMISSIONS.BRAND_READ),
  asyncRoute(controller.followUps),
);
communicationRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
communicationRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.create));
communicationRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.remove));
