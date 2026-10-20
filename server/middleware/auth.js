import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { User } from '../src/modules/auth/auth.model.js';
import { Session } from '../src/modules/auth/session.model.js';
import { ensureDefaultOrganization } from '../src/modules/organizations/organization.service.js';
import { env, cookieOptions } from '../config/env.js';
import { ApiError, asyncRoute } from '../utils/http.js';
const accessLifetime = 15 * 60 * 1000;
const refreshLifetime = 7 * 24 * 60 * 60 * 1000;
const refreshCookieOptions = { ...cookieOptions, path: '/api/auth' };
const tokenHash = (token) => crypto.createHmac('sha256', env.secret).update(token).digest('hex');
const labelFor = (userAgent = '') => {
  const device = /android|iphone|ipad|mobile/i.test(userAgent) ? 'Mobile device' : 'Desktop device';
  const browser = new RegExp('edg/', 'i').test(userAgent)
    ? 'Microsoft Edge'
    : new RegExp('firefox/', 'i').test(userAgent)
      ? 'Firefox'
      : new RegExp('chrome/', 'i').test(userAgent)
        ? 'Google Chrome'
        : new RegExp('safari/', 'i').test(userAgent)
          ? 'Safari'
          : 'Browser';
  return { device, browser };
};
function setAccessCookie(res, user, session) {
  const token = jwt.sign(
    { sub: String(user._id), sid: String(session._id), version: user.sessionVersion || 0 },
    env.secret,
    {
      expiresIn: accessLifetime / 1000,
      issuer: 'creatoros',
      audience: 'creatoros-web',
    },
  );
  res.cookie('creatoros_session', token, { ...cookieOptions, maxAge: accessLifetime });
}
function setRefreshCookie(res, token) {
  res.cookie('creatoros_refresh', token, { ...refreshCookieOptions, maxAge: refreshLifetime });
}
export function clearAuthCookies(res) {
  res.clearCookie('creatoros_session', cookieOptions);
  res.clearCookie('creatoros_refresh', refreshCookieOptions);
}
export async function createSession(req, res, user) {
  const { organization } = await ensureDefaultOrganization(user);
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  const labels = labelFor(req.get('user-agent'));
  const session = await Session.create({
    userId: user._id,
    activeOrganizationId: organization._id,
    tokenHash: tokenHash(refreshToken),
    ...labels,
    ip: req.ip || req.socket.remoteAddress,
    expiresAt: new Date(Date.now() + refreshLifetime),
    lastUsedAt: new Date(),
  });
  setAccessCookie(res, user, session);
  setRefreshCookie(res, refreshToken);
  return session;
}
export async function refreshSession(req, res) {
  const refreshToken = req.cookies.creatoros_refresh;
  if (!refreshToken) throw new ApiError(401, 'Your session has expired. Please sign in again.');
  const session = await Session.findOne({
    tokenHash: tokenHash(refreshToken),
    expiresAt: { $gt: new Date() },
  }).select('+tokenHash');
  if (!session) {
    clearAuthCookies(res);
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
  const user = await User.findById(session.userId).select('+sessionVersion');
  if (!user || !user.isActive || !user.emailVerified) {
    await Session.deleteOne({ _id: session._id });
    clearAuthCookies(res);
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
  const nextRefreshToken = crypto.randomBytes(48).toString('base64url');
  session.tokenHash = tokenHash(nextRefreshToken);
  session.lastUsedAt = new Date();
  await session.save();
  setAccessCookie(res, user, session);
  setRefreshCookie(res, nextRefreshToken);
  return { user, session };
}
async function sessionFromToken(token) {
  try {
    if (!token) return null;
    const payload = jwt.verify(token, env.secret, {
      issuer: 'creatoros',
      audience: 'creatoros-web',
      algorithms: ['HS256'],
    });
    if (!payload.sid) return null;
    const [user, session] = await Promise.all([
      User.findById(payload.sub).select('+sessionVersion'),
      Session.findOne({
        _id: payload.sid,
        userId: payload.sub,
        expiresAt: { $gt: new Date() },
      }),
    ]);
    if (
      !user ||
      !session ||
      !user.isActive ||
      !user.emailVerified ||
      (user.sessionVersion ?? 0) !== (payload.version ?? 0)
    )
      return null;
    if (session.lastUsedAt && Date.now() - session.lastUsedAt.getTime() > 60000)
      Session.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});
    return { user, session };
  } catch {
    return null;
  }
}
export async function userFromToken(token) {
  return (await sessionFromToken(token))?.user || null;
}
export async function revokeUserSessions(userId) {
  await Session.deleteMany({ userId });
}
export async function revokeSession(userId, sessionId) {
  return Session.findOneAndDelete({ _id: sessionId, userId });
}
export const authenticate = asyncRoute(async (req, res, next) => {
  // fallback to bearer header if session cookie not present (api/mobile clients)
  let token = req.cookies?.creatoros_session;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  const auth = await sessionFromToken(token);
  if (!auth) throw new ApiError(401, 'Please sign in to continue.');
  req.user = auth.user;
  req.session = auth.session;
  next();
});
export const authorize =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : next(new ApiError(403, 'You do not have access to this page.'));