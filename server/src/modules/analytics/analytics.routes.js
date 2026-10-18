import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { asyncRoute } from '../../../utils/http.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireOrganization);

router.get('/executive', requirePermission('analytics.read'), asyncRoute(analyticsController.getExecutive));
router.get('/revenue', requirePermission('analytics.read'), asyncRoute(analyticsController.getRevenue));
router.get('/campaigns', requirePermission('analytics.read'), asyncRoute(analyticsController.getCampaigns));
router.get('/creators', requirePermission('analytics.read'), asyncRoute(analyticsController.getCreators));
router.get('/brands', requirePermission('analytics.read'), asyncRoute(analyticsController.getBrands));
router.get('/risks', requirePermission('analytics.read'), asyncRoute(analyticsController.getRisks));
router.get('/forecast', requirePermission('analytics.read'), asyncRoute(analyticsController.getForecast));
router.patch('/insights/:id/read', requirePermission('analytics.read'), asyncRoute(analyticsController.markInsightRead));

export default router;
