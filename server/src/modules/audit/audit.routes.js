import { Router } from 'express';
import * as controller from './audit.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { asyncRoute } from '../../../utils/http.js';
export const auditRouter = Router();
auditRouter.use(authenticate, requireOrganization);
auditRouter.get(
  '/',
  requirePermission(PERMISSIONS.ORGANIZATION_READ),
  asyncRoute(controller.list),
);
