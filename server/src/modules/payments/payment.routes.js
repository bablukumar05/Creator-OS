import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './payment.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';

export const paymentRouter = Router();

paymentRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);

paymentRouter.get('/gateway-config', asyncRoute(controller.getGatewaySettings));
paymentRouter.get('/public/invoice/:invoiceId', asyncRoute(controller.getPublicInvoice));
paymentRouter.post('/public/checkout/:invoiceId', asyncRoute(controller.createPublicCheckout));
paymentRouter.post('/public/verify', asyncRoute(controller.verifyPublicPayment));

const protectedRouter = Router();
protectedRouter.use(authenticate, requireOrganization);

protectedRouter.get('/stats', requirePermission(PERMISSIONS.INVOICE_READ), asyncRoute(controller.getStats));

protectedRouter
  .route('/escrow')
  .get(requirePermission(PERMISSIONS.INVOICE_READ), asyncRoute(controller.listEscrows))
  .post(requirePermission(PERMISSIONS.INVOICE_WRITE), asyncRoute(controller.createEscrow));

protectedRouter
  .route('/escrow/:id')
  .get(requirePermission(PERMISSIONS.INVOICE_READ), asyncRoute(controller.getEscrow));

protectedRouter.post(
  '/escrow/:id/milestones/:milestoneId/fund',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.fundEscrowMilestone),
);

protectedRouter.post(
  '/escrow/:id/milestones/:milestoneId/submit',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.submitMilestoneDeliverable),
);

protectedRouter.post(
  '/escrow/:id/milestones/:milestoneId/approve',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.approveMilestoneWork),
);

protectedRouter.post(
  '/escrow/:id/milestones/:milestoneId/release',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.releaseEscrowMilestone),
);

protectedRouter.post(
  '/escrow/:id/milestones/:milestoneId/dispute',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.disputeEscrowMilestone),
);

protectedRouter.post(
  '/escrow/:id/milestones/:milestoneId/resolve-dispute',
  requirePermission(PERMISSIONS.INVOICE_WRITE),
  asyncRoute(controller.resolveEscrowDispute),
);

protectedRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.INVOICE_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.INVOICE_WRITE), asyncRoute(controller.create));

protectedRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.INVOICE_READ), asyncRoute(controller.detail))
  .delete(requirePermission(PERMISSIONS.INVOICE_WRITE), asyncRoute(controller.remove));

paymentRouter.use(protectedRouter);
