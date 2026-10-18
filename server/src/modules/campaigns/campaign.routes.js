import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './campaign.controller.js';
import { deliverableRouter } from './deliverables/deliverable.routes.js';
import { approvalRouter } from './approvals/approval.routes.js';
import { milestoneRouter } from './milestones/milestone.routes.js';
import { activityRouter } from './activities/activity.routes.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const campaignRouter = Router();
campaignRouter.use(authenticate, requireOrganization);
campaignRouter.get(
  '/analytics',
  requirePermission(PERMISSIONS.CAMPAIGN_READ),
  asyncRoute(controller.analytics),
);
campaignRouter.use('/:campaignId/deliverables', deliverableRouter);
campaignRouter.use('/:campaignId/approvals', approvalRouter);
campaignRouter.use('/:campaignId/milestones', milestoneRouter);
campaignRouter.use('/:campaignId/activities', activityRouter);
campaignRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
campaignRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CAMPAIGN_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.create));
campaignRouter.get(
  '/:id/related',
  requirePermission(PERMISSIONS.CAMPAIGN_READ),
  asyncRoute(controller.related),
);
campaignRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CAMPAIGN_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.CAMPAIGN_WRITE), asyncRoute(controller.remove));
campaignRouter.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.CAMPAIGN_WRITE),
  asyncRoute(controller.duplicate),
);
campaignRouter.post(
  '/:id/restore',
  requirePermission(PERMISSIONS.CAMPAIGN_WRITE),
  asyncRoute(controller.restore),
);
