import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Profile } from '../models/resources.js';
import { env, cookieOptions } from '../config/env.js';
import { createSession } from '../middleware/auth.js';
import { issueOtp } from '../services/otpService.js';
import { ApiError, asyncRoute, ok } from '../utils/http.js';
export const oauthRouter = Router();
const graph = () => `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || 'v23.0'}`;
const config = () => ({
  id: process.env.FACEBOOK_APP_ID,
  secret: process.env.FACEBOOK_APP_SECRET,
  callback: process.env.FACEBOOK_CALLBACK_URL,
  auth: `https://www.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || 'v23.0'}/dialog/oauth`,
  token: graph() + '/oauth/access_token',
  scope: 'email,public_profile',
});

oauthRouter.get(
  '/facebook',
  asyncRoute(async (req, res) => {
    const c = config();
    if (!c.id || !c.secret || !c.callback)
      throw new ApiError(503, 'Facebook sign-in is not configured.');
    const state = crypto.randomBytes(32).toString('hex');
    res.cookie('creatoros_oauth', state, { ...cookieOptions, maxAge: 600000 });
    res.redirect(
      c.auth +
        '?' +
        new URLSearchParams({
          client_id: c.id,
          redirect_uri: c.callback,
          response_type: 'code',
          scope: c.scope,
          state,
        }),
    );
  }),
);
oauthRouter.get(
  '/facebook/callback',
  asyncRoute(async (req, res) => {
    try {
      if (!req.query.state || req.query.state !== req.cookies.creatoros_oauth || !req.query.code)
        throw new Error('Invalid OAuth state');
      res.clearCookie('creatoros_oauth', cookieOptions);
      const c = config();
      const tokenResponse = await fetch(c.token, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: c.id,
          client_secret: c.secret,
          redirect_uri: c.callback,
          code: String(req.query.code),
          grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!tokenResponse.ok) throw new Error('Token exchange failed');
      const token = await tokenResponse.json();
      const url =
        graph() +
        '/me?' +
        new URLSearchParams({
          fields: 'id,name,email,picture',
          appsecret_proof: crypto
            .createHmac('sha256', c.secret)
            .update(token.access_token)
            .digest('hex'),
        });
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token.access_token}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Identity lookup failed');
      const identity = await response.json();
      const providerId = identity.id;
      if (!providerId) throw new Error('Missing identity');
      let user = await User.findOne({ facebookId: providerId }).select('+sessionVersion');
      if (!user && identity.email) {
        const existing = await User.findOne({ email: identity.email.toLowerCase() }).select(
          '+sessionVersion',
        );
        if (existing) {
          throw new Error('Sign in to the existing account');
        }
      }
      if (!user) {
        user = await User.create({
          name: identity.name || 'Creator',
          facebookId: providerId,
          email: identity.email?.toLowerCase(),
          avatar: identity.picture?.data?.url,
        });
        await Profile.create({ owner: user._id });
      }
      if (!user.isActive) throw new Error('Inactive account');
      if (!user.emailVerified) {
        const onboard = jwt.sign({ sub: String(user._id), purpose: 'social-email' }, env.secret, {
          expiresIn: '10m',
          audience: 'creatoros-onboarding',
          issuer: 'creatoros',
        });
        res.cookie('creatoros_onboarding', onboard, { ...cookieOptions, maxAge: 600000 });
        return res.redirect(env.client + '/complete-account');
      }
      await createSession(req, res, user);
      res.redirect(env.client + '/dashboard');
    } catch {
      res.redirect(env.client + '/login?error=social');
    }
  }),
);
oauthRouter.post(
  '/complete-social',
  asyncRoute(async (req, res) => {
    let payload;
    try {
      payload = jwt.verify(req.cookies.creatoros_onboarding, env.secret, {
        audience: 'creatoros-onboarding',
        issuer: 'creatoros',
        algorithms: ['HS256'],
      });
    } catch {
      throw new ApiError(401, 'Social sign-in expired. Please try again.');
    }
    const email = z.string().email().parse(req.body.email).toLowerCase();
    const user = await User.findById(payload.sub);
    if (!user || user.emailVerified) throw new ApiError(400, 'Invalid account state.');
    if (await User.exists({ email, _id: { $ne: user._id } }))
      throw new ApiError(
        409,
        'This email belongs to an existing account. Sign in to that account.',
      );
    user.email = email;
    await user.save();
    await issueOtp(user, 'verification');
    res.clearCookie('creatoros_onboarding', cookieOptions);
    ok(res, { email }, 'Verification code sent.');
  }),
);