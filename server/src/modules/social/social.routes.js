import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './social.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';

export const socialRouter = Router();

socialRouter.use(authenticate, requireOrganization);

socialRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid social channel ID.')),
);

socialRouter.get('/stats', requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.getSocialStats));
socialRouter.post('/sync-all', requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.syncAllChannels));
socialRouter.post('/publish', requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.publishPost));
socialRouter.post('/connect', requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.connectChannel));

socialRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.listChannels))
  .post(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.connectChannel));

socialRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CONTENT_READ), asyncRoute(controller.getChannel))
  .delete(requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.disconnectChannel));

socialRouter.post('/:id/sync', requirePermission(PERMISSIONS.CONTENT_WRITE), asyncRoute(controller.syncChannel));
