import { Router } from 'express';
import * as controller from './member.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { asyncRoute } from '../../../utils/http.js';
export const memberRouter = Router();
export const invitationRouter = memberRouter;
memberRouter.use(authenticate);
memberRouter.post('/accept-invite', asyncRoute(controller.acceptInvite));
memberRouter.get(
  '/',
  requireOrganization,
  requirePermission(PERMISSIONS.MEMBER_READ),
  asyncRoute(controller.list),
);
memberRouter.post(
  '/invite',
  requireOrganization,
  requirePermission(PERMISSIONS.MEMBER_INVITE),
  asyncRoute(controller.invite),
);
memberRouter.patch(
  '/:id',
  requireOrganization,
  requirePermission(PERMISSIONS.MEMBER_UPDATE),
  asyncRoute(controller.update),
);
memberRouter.delete(
  '/:id',
  requireOrganization,
  requirePermission(PERMISSIONS.MEMBER_REMOVE),
  asyncRoute(controller.remove),
);
