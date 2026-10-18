import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './contact.controller.js';
import { authenticate } from '../../../../middleware/auth.js';
import { requireOrganization } from '../../../middleware/organization.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../../utils/http.js';
export const contactRouter = Router({ mergeParams: true });
contactRouter.use(authenticate, requireOrganization);
contactRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
contactRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.create));
contactRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.BRAND_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.BRAND_WRITE), asyncRoute(controller.remove));
