import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from './role.types.js';
import { listRoles } from './role.service.js';
import { ok } from '../../../utils/http.js';
export const roleRouter = Router();
export const permissionRouter = roleRouter;
roleRouter.use(authenticate, requireOrganization);
roleRouter.get('/', requirePermission(PERMISSIONS.ROLE_READ), (req, res) => {
  ok(res, {
    currentRole: req.membership.role,
    effectivePermissions: req.membership.effectivePermissions,
    roles: listRoles(),
  });
});
