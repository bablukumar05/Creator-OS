import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { authRouter } from './src/modules/auth/auth.routes.js';
import { auditRouter } from './src/modules/audit/audit.routes.js';
import { organizationRouter } from './src/modules/organizations/organization.routes.js';
import { invitationRouter, memberRouter } from './src/modules/members/member.routes.js';
import { permissionRouter, roleRouter } from './src/modules/roles/role.routes.js';
import { brandRouter } from './src/modules/brands/brand.routes.js';
import { contactRouter } from './src/modules/brands/contacts/contact.routes.js';
import { communicationRouter } from './src/modules/brands/communications/communication.routes.js';
import { documentRouter } from './src/modules/brands/documents/document.routes.js';
import { campaignRouter } from './src/modules/campaigns/campaign.routes.js';
import { deliverableRouter } from './src/modules/campaigns/deliverables/deliverable.routes.js';
import { approvalRouter } from './src/modules/campaigns/approvals/approval.routes.js';
import { contentRouter } from './src/modules/content/content.routes.js';
import { briefRouter } from './src/modules/briefs/brief.routes.js';
import { assetRouter } from './src/modules/assets/asset.routes.js';
import { reviewRouter } from './src/modules/reviews/review.routes.js';
import { publishingRouter } from './src/modules/publishing/publishing.routes.js';
import { creatorRouter } from './src/modules/creators/creator.routes.js';
import { talentRouter } from './src/modules/talent/talent.routes.js';
import { marketplaceRouter } from './src/modules/marketplace/marketplace.routes.js';
import { contractRouter } from './src/modules/contracts/contract.routes.js';
import { dealRouter } from './src/modules/deals/deal.routes.js';
import {
  expenseRouter,
  financeRouter,
  revenueRouter,
} from './src/modules/finance/finance.routes.js';
import { invoiceRouter } from './src/modules/invoices/invoice.routes.js';
import { paymentRouter } from './src/modules/payments/payment.routes.js';
import { socialRouter } from './src/modules/social/social.routes.js';
import { taskRouter } from './src/modules/tasks/task.routes.js';
import analyticsRouter from './src/modules/analytics/analytics.routes.js';
import aiRouter from './src/modules/analytics/ai.routes.js';
import { workspaceRouter } from './routes/workspace.js';
import { resourceRouter } from './routes/resources.js';
import { adminRouter } from './routes/admin.js';
import { authenticate } from './middleware/auth.js';
import { ApiError } from './utils/http.js';

export function createApp() {
  const app = express();
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });
  app.disable('x-powered-by');
  if (env.production) app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.client, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(
    // rate limit api endpoints to mitigate brute force & ddos
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: env.production ? 300 : 1500,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Please wait a moment.' },
    }),
  );
  // verify csrf origin on state-mutating requests
  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.headers.origin;
      if (origin && origin !== env.client)
        return next(new ApiError(403, 'Untrusted request origin.'));
      if (env.production && !origin)
        return next(new ApiError(403, 'A trusted Origin header is required.'));
    }
    next();
  });
  app.get(['/api/health', '/api/v1/health'], (req, res) =>
    res.json({
      success: true,
      message: 'Service is running.',
      data: { status: 'ok', demo: env.demo },
    }),
  );
  app.get(['/api/ready', '/api/v1/ready'], async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) throw new Error('Disconnected');
      await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 3000 });
      res.json({ success: true, message: 'Database is ready.', data: { status: 'ready' } });
    } catch {
      res.status(503).json({ success: false, message: 'Database is unavailable.' });
    }
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/v1/organizations', organizationRouter);
  app.use('/api/organizations', organizationRouter);
  app.use('/api/v1/members', memberRouter);
  app.use('/api/members', memberRouter);
  app.use('/api/v1/invitations', invitationRouter);
  app.use('/api/invitations', invitationRouter);
  app.use('/api/v1/roles', roleRouter);
  app.use('/api/roles', roleRouter);
  app.use('/api/v1/permissions', permissionRouter);
  app.use('/api/permissions', permissionRouter);
  app.use('/api/v1/audit-logs', auditRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/v1/brands', brandRouter);
  app.use('/api/brands', brandRouter);
  app.use('/api/v1/contacts', contactRouter);
  app.use('/api/contacts', contactRouter);
  app.use('/api/v1/communications', communicationRouter);
  app.use('/api/communications', communicationRouter);
  app.use('/api/v1/documents', documentRouter);
  app.use('/api/documents', documentRouter);
  app.use('/api/v1/campaigns', campaignRouter);
  app.use('/api/campaigns', campaignRouter);
  app.use('/api/v1/deliverables', deliverableRouter);
  app.use('/api/deliverables', deliverableRouter);
  app.use('/api/v1/approvals', approvalRouter);
  app.use('/api/approvals', approvalRouter);
  app.use('/api/v1/content', contentRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/v1/briefs', briefRouter);
  app.use('/api/briefs', briefRouter);
  app.use('/api/v1/assets', assetRouter);
  app.use('/api/assets', assetRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/v1/publishing', publishingRouter);
  app.use('/api/publishing', publishingRouter);
  app.use('/api/v1/creators', creatorRouter);
  app.use('/api/creators', creatorRouter);
  app.use('/api/v1/talent', talentRouter);
  app.use('/api/talent', talentRouter);
  app.use('/api/v1/marketplace', marketplaceRouter);
  app.use('/api/marketplace', marketplaceRouter);
  app.use('/api/v1/contracts', contractRouter);
  app.use('/api/contracts', contractRouter);
  app.use('/api/v1/deals', dealRouter);
  app.use('/api/deals', dealRouter);
  app.use('/api/v1/invoices', invoiceRouter);
  app.use('/api/invoices', invoiceRouter);
  app.use('/api/v1/payments', paymentRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/v1/social', socialRouter);
  app.use('/api/social', socialRouter);
  app.use('/api/v1/revenue', revenueRouter);
  app.use('/api/revenue', revenueRouter);
  app.use('/api/v1/expenses', expenseRouter);
  app.use('/api/expenses', expenseRouter);
  app.use('/api/v1/finance', financeRouter);
  app.use('/api/finance', financeRouter);
  app.use('/api/v1/tasks', taskRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/v1', authenticate, workspaceRouter);
  app.use('/api', authenticate, workspaceRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/v1', resourceRouter);
  app.use('/api', resourceRouter);
  app.use((req, res, next) => next(new ApiError(404, 'Page not found.')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = error.status || 500,
      message = status === 500 ? 'Something went wrong. Please try again.' : error.message,
      errors;
    if (error.code === 11000) {
      status = 409;
      message = 'An account with this email address already exists. Please sign in.';
    } else if (error instanceof ZodError) {
      status = 400;
      message = 'Validation failed.';
      errors = error.flatten().fieldErrors;
    }
    res.status(status).json({ success: false, message, code: error.code, errors });
  });
  return app;
}