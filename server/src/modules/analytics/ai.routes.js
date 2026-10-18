import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { requireOrganization } from '../../middleware/organization.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { asyncRoute } from '../../../utils/http.js';
import * as aiController from './ai.controller.js';

import * as genaiController from '../ai/genai.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireOrganization);

router.post('/chat', requirePermission('analytics.read'), asyncRoute(aiController.chat));
router.post('/analytics/query', requirePermission('analytics.read'), asyncRoute(aiController.query));
router.get('/conversations', requirePermission('analytics.read'), asyncRoute(aiController.listConversations));
router.get('/conversations/:id', requirePermission('analytics.read'), asyncRoute(aiController.getConversationMessages));

router.post('/script', requirePermission('content.write'), asyncRoute(genaiController.generateScript));
router.post('/contract-analysis', requirePermission('contract.read'), asyncRoute(genaiController.analyzeContract));
router.post('/pitch', requirePermission('deal.write'), asyncRoute(genaiController.generateBrandPitch));
router.post('/save-script', requirePermission('content.write'), asyncRoute(genaiController.saveScriptToContent));

export default router;
