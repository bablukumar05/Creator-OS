import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './task.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const taskRouter = Router();
taskRouter.use(authenticate, requireOrganization);
taskRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
taskRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.TASK_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.TASK_WRITE), asyncRoute(controller.create));
taskRouter.get(
  '/:id/related',
  requirePermission(PERMISSIONS.TASK_READ),
  asyncRoute(controller.related),
);
taskRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.TASK_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.TASK_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.TASK_WRITE), asyncRoute(controller.remove));
taskRouter.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.TASK_WRITE),
  asyncRoute(controller.duplicate),
);
taskRouter.post(
  '/:id/restore',
  requirePermission(PERMISSIONS.TASK_WRITE),
  asyncRoute(controller.restore),
);
