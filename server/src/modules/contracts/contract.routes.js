import { Router } from 'express';
import mongoose from 'mongoose';
import * as controller from './contract.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
export const contractRouter = Router();

contractRouter.get('/public/sign/:token', asyncRoute(controller.getPublicSigningContract));
contractRouter.post('/public/sign/:token', asyncRoute(controller.signContractPublic));

const protectedRouter = Router();
protectedRouter.use(authenticate, requireOrganization);

protectedRouter.get(
  '/expiring',
  requirePermission(PERMISSIONS.CONTRACT_READ),
  asyncRoute(controller.expiring),
);

protectedRouter.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
);

protectedRouter.post(
  '/:id/sign',
  requirePermission(PERMISSIONS.CONTRACT_WRITE),
  asyncRoute(controller.signContractInApp),
);

protectedRouter.get(
  '/:id/audit-certificate',
  requirePermission(PERMISSIONS.CONTRACT_READ),
  asyncRoute(controller.getAuditCertificate),
);

protectedRouter
  .route('/')
  .get(requirePermission(PERMISSIONS.CONTRACT_READ), asyncRoute(controller.list))
  .post(requirePermission(PERMISSIONS.CONTRACT_WRITE), asyncRoute(controller.create));

protectedRouter.get(
  '/:id/related',
  requirePermission(PERMISSIONS.CONTRACT_READ),
  asyncRoute(controller.related),
);

protectedRouter
  .route('/:id')
  .get(requirePermission(PERMISSIONS.CONTRACT_READ), asyncRoute(controller.detail))
  .patch(requirePermission(PERMISSIONS.CONTRACT_WRITE), asyncRoute(controller.update))
  .delete(requirePermission(PERMISSIONS.CONTRACT_WRITE), asyncRoute(controller.remove));

protectedRouter.post(
  '/:id/duplicate',
  requirePermission(PERMISSIONS.CONTRACT_WRITE),
  asyncRoute(controller.duplicate),
);

protectedRouter.post(
  '/:id/restore',
  requirePermission(PERMISSIONS.CONTRACT_WRITE),
  asyncRoute(controller.restore),
);

contractRouter.use(protectedRouter);
