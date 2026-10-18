import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './brand.controller.js';
import { contactRouter } from './contacts/contact.routes.js';
import { communicationRouter } from './communications/communication.routes.js';
import { noteRouter } from './notes/note.routes.js';
import { documentRouter } from './documents/document.routes.js';
import { activityRouter } from './activities/activity.routes.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const brandRouter = Router();
brandRouter.use(authenticate, requireOrganization);
brandRouter.get(
  '/analytics',
  requirePermission(PERMISSIONS.BRAND_READ),
  asyncRoute(controller.analytics),
);
brandRouter.use('/:brandId/contacts', contactRouter);
brandRouter.use('/:brandId/communications', communicationRouter);
brandRouter.use('/:brandId/notes', noteRouter);
brandRouter.use('/:brandId/documents', documentRouter);
brandRouter.use('/:brandId/activities', activityRouter);
brandRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
brandRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.create));
brandRouter.get(
  '/:id/related',
  requirePermission(PERMISSIONS.BRAND_READ),
  asyncRoute(controller.related),
);
brandRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.remove));
brandRouter.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.BRAND_WRITE),
  asyncRoute(controller.duplicate),
);
brandRouter.post(
  '/:id/restore',
  requirePermission(PERMISSIONS.BRAND_WRITE),
  asyncRoute(controller.restore),
);
