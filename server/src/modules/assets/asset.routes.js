import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './asset.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const assetRouter = Router();
assetRouter.use(authenticate, requireOrganization);
assetRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
assetRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.list));
assetRouter.post(
  '/upload',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  asyncRoute(controller.upload),
);
assetRouter.post(
  '/presign',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  asyncRoute(controller.presign),
);
assetRouter.post(
  '/confirm',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  asyncRoute(controller.confirm),
);
assetRouter.get(
  '/queue/status',
  requirePermission(PERMISSIONS.CONTENT_READ),
  asyncRoute(controller.queueStatus),
);
assetRouter.post(
  '/:id/versions',
  requirePermission(PERMISSIONS.CONTENT_WRITE),
  asyncRoute(controller.addVersion),
);
assetRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.detail))
  .delete(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.remove));
