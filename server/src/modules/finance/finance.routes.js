import { Router } from 'express';
import mongoose from 'mongoose';
import { expenseController, revenueController, summary } from './finance.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requireAnyPermission, requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '../roles/role.types.js';
import { ApiError, asyncRoute } from '../../../utils/http.js';
function createScopedResourceRouter(controller, readPermission, writePermission) {
  const router = Router();
  router.use(authenticate, requireOrganization);
  router.param('id', (req, res, next, id) =>
    mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid record ID.')),
  );
  router
    .route('/')
    .get(requirePermission(readPermission), asyncRoute(controller.list))
    .post(requirePermission(writePermission), asyncRoute(controller.create));
  router.get('/:id/related', requirePermission(readPermission), asyncRoute(controller.related));
  router
    .route('/:id')
    .get(requirePermission(readPermission), asyncRoute(controller.detail))
    .patch(requirePermission(writePermission), asyncRoute(controller.update))
    .delete(requirePermission(writePermission), asyncRoute(controller.remove));
  router.post(
    '/:id/duplicate',
    requirePermission(writePermission),
    asyncRoute(controller.duplicate),
  );
  router.post(
    '/:id/restore',
    requirePermission(writePermission),
    asyncRoute(controller.restore),
  );
  return router;
}
export const revenueRouter = createScopedResourceRouter(
  revenueController,
  PERMISSIONS.REVENUE_READ,
  PERMISSIONS.REVENUE_WRITE,
);
export const expenseRouter = createScopedResourceRouter(
  expenseController,
  PERMISSIONS.EXPENSE_READ,
  PERMISSIONS.EXPENSE_WRITE,
);
export const financeRouter = Router();
financeRouter.use(authenticate, requireOrganization);
financeRouter.get(
  '/summary',
  requireAnyPermission([
    PERMISSIONS.REVENUE_READ,
    PERMISSIONS.EXPENSE_READ,
    PERMISSIONS.INVOICE_READ,
  ]),
  asyncRoute(summary),
);
