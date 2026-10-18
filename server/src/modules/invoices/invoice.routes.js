import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './invoice.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const invoiceRouter = Router();
invoiceRouter.use(authenticate, requireOrganization);
invoiceRouter.get(
  '/overdue',
  requirePermission(PERMISSIONS.INVOICE_READ),
  asyncRoute(controller.overdue),
);
invoiceRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);
invoiceRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.INVOICE_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.INVOICE_WRITE), asyncRoute(controller.create));
invoiceRouter.get(
  '/:id/pdf',
  requirePermission(PERMISSIONS.INVOICE_READ),
  asyncRoute(controller.pdf),
);
invoiceRouter.get(
  '/:id/related',
  requirePermission(PERMISSIONS.INVOICE_READ),
  asyncRoute(controller.related),
);
invoiceRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.INVOICE_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.INVOICE_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.INVOICE_WRITE), asyncRoute(controller.remove));
invoiceRouter.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.duplicate),
);
invoiceRouter.post(
  '/:id/restore',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.restore),
);
