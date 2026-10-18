import { Router } from 'express';
import * as controller from './activity.controller.js';
import { authenticate } from '../../../../middleware/auth.js';
import { requireOrganization } from '../../../middleware/organization.middleware.js';
import { requirePermission } from '../../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../../roles/role.types.js';
import { asyncRoute } from '../../../../utils/http.js';
export const activityRouter = Router({ mergeParams: true });
activityRouter.use(authenticate, requireOrganization);
activityRouter.get(
  '/',
  requirePermission(PERMISSIONS.BRAND_READ),
  asyncRoute(controller.list),
);
