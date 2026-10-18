import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from './auth.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { asyncRoute, ok, safeUser } from '../../../utils/http.js';
import { env } from '../../../config/env.js';
import { emailConfigured } from '../../../services/emailService.js';
import { oauthRouter } from '../../../routes/oauth.js';

export const authRouter = Router();

authRouter.get('/config', (req, res) =>
  ok(res, {
    demo: env.demo,
    email: emailConfigured(),
    facebook: !!process.env.FACEBOOK_APP_ID,
  }),
);
authRouter.get('/me', authenticate, (req, res) => ok(res, safeUser(req.user)));
authRouter.get('/sessions', authenticate, asyncRoute(controller.listSessions));
authRouter.delete('/sessions/:id', authenticate, asyncRoute(controller.deleteSession));

authRouter.use(
  rateLimit({
    windowMs: 15 * 60000,
    limit: env.production ? 10 : 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
  }),
);
authRouter.post('/register', asyncRoute(controller.register));
authRouter.post('/login', asyncRoute(controller.login));
authRouter.post('/logout', authenticate, asyncRoute(controller.logout));
authRouter.post('/refresh', asyncRoute(controller.refresh));
authRouter.post('/forgot-password', asyncRoute(controller.forgotPassword));
authRouter.post('/verify-email-otp', asyncRoute(controller.verifyEmail));
authRouter.post('/resend-verification-otp', asyncRoute(controller.resendVerification));
authRouter.post('/resend-reset-otp', asyncRoute(controller.resendReset));
authRouter.post('/verify-reset-otp', asyncRoute(controller.verifyReset));
authRouter.post('/reset-password', asyncRoute(controller.resetPassword));
authRouter.patch('/account', authenticate, asyncRoute(controller.updateAccount));
authRouter.post('/change-password', authenticate, asyncRoute(controller.changePassword));
authRouter.delete('/account', authenticate, asyncRoute(controller.deleteAccount));
authRouter.use('/', oauthRouter);