import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './document.controller.js';
import { authenticate } from '../../../../middleware/auth.js';
import { requireOrganization } from '../../../middleware/organization.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../../utils/http.js';
export const documentRouter = Router({ mergeParams: true });
documentRouter.use(authenticate, requireOrganization);
documentRouter.post(
  '/upload',
  requirePermission(PERMISSIONS.BRAND_WRITE),
  asyncRoute(controller.upload),
);
documentRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
documentRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.upload));
documentRouter
  .route('/:id')
  .delete(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.remove));
