import { Router } from 'express';
import mongoose from 'mongoose';
import { resources } from '../../shared/resources.js';
import * as controller from '../controllers/resourceController.js';
import { requireOrganization } from '../src/middleware/organization.middleware.js';
import { requireResourcePermission } from '../src/middleware/rbac.middleware.js';
import { asyncRoute, ApiError } from '../utils/http.js';
export const resourceRouter = Router();
resourceRouter.param('resource', (req, res, next, key) => {
  if (!resources[key]) return next(new ApiError(404, 'Resource not found.'));
  req.resource = key;
  next();
});
resourceRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
resourceRouter
  .route('/:resource')
  .get(requireOrganization, requireResourcePermission('read'), asyncRoute(controller.list))
  .post(requireOrganization, requireResourcePermission('write'), asyncRoute(controller.create));
resourceRouter.get(
  '/:resource/:id/related',
  requireOrganization,
  requireResourcePermission('read'),
  asyncRoute(controller.related),
);
resourceRouter
  .route('/:resource/:id')
  .get(requireOrganization, requireResourcePermission('read'), asyncRoute(controller.detail))
  .patch(requireOrganization, requireResourcePermission('write'), asyncRoute(controller.update))
  .delete(requireOrganization, requireResourcePermission('write'), asyncRoute(controller.remove));
resourceRouter.post(
  '/:resource/:id/duplicate',
  requireOrganization,
  requireResourcePermission('write'),
  asyncRoute(controller.duplicate),
);
resourceRouter.post(
  '/:resource/:id/restore',
  requireOrganization,
  requireResourcePermission('write'),
  asyncRoute(controller.restore),
);