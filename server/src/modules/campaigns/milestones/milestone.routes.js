import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './milestone.controller.js';
import { authenticate } from '../../../../middleware/auth.js';
import { requireOrganization } from '../../../middleware/organization.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../../utils/http.js';
export const milestoneRouter = Router({ mergeParams: true });
milestoneRouter.use(authenticate, requireOrganization);
milestoneRouter.param('milestoneId', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
milestoneRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CAMPAIGN_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.create));
milestoneRouter
  .route('/:milestoneId')
  .patch(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.remove));
