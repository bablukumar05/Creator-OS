import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './approval.controller.js';
import { authenticate } from '../../../../middleware/auth.js';
import { requireOrganization } from '../../../middleware/organization.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../../utils/http.js';
export const approvalRouter = Router({ mergeParams: true });
approvalRouter.use(authenticate, requireOrganization);
approvalRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
approvalRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CAMPAIGN_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.create));
approvalRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CAMPAIGN_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.review));
