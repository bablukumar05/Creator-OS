import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { User } from './auth.model.js';
import { Session } from './session.model.js';
import { ensureDefaultOrganization } from '../organizations/organization.service.js';
import { Profile, models, Analytics, Activity } from '../../../models/resources.js';
import { cookieOptions } from '../../../config/env.js';
import {
  clearAuthCookies,
  createSession,
  refreshSession,
  revokeSession,
  revokeUserSessions,
} from '../../../middleware/auth.js';
import { issueOtp, consumeOtp, hashToken } from '../../../services/otpService.js';
import { sendEmail } from '../../../services/emailService.js';
import { ApiError } from '../../../utils/http.js';
export async function register(data) {
  if (await User.exists({ email: data.email }))
    throw new ApiError(
      409,
      'Unable to register this email. Try signing in or recovering your account.',
    );
  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone?.trim() ? data.phone.trim() : undefined,
    password: await bcrypt.hash(data.password, 12),
  });
  await Profile.create({ owner: user._id });
  const { organization } = await ensureDefaultOrganization(user);
  await issueOtp(user, 'verification');
  return { user, organization, message: 'Account created.' };
}
export async function authenticate(data, req, res) {
  const identifier = data.identifier.trim().toLowerCase();
  const user = await User.findOne(
    identifier.includes('@')
      ? { email: identifier }
      : { phone: identifier.replace(/[\s()-]/g, '') },
  ).select('+password +sessionVersion');
  const valid = await bcrypt.compare(
    data.password,
    user?.password || '$2b$12$5mN8G34yHPKNQkpgGtbjv.fvWVA5FmRvTJnAPr7WdmB11RRJFB.Mi',
  );
  if (!user || !valid || !user.isActive)
    throw new ApiError(401, 'Invalid email/phone or password.');
  if (!user.emailVerified)
    throw new ApiError(403, 'Please verify your email before continuing.', 'EMAIL_UNVERIFIED');
  user.lastLogin = new Date();
  await user.save();
  const { organization } = await ensureDefaultOrganization(user);
  await createSession(req, res, user, data.remember);
  return { user, organization };
}
export async function logout(user, session, res) {
  await revokeSession(user._id, session._id);
  clearAuthCookies(res);
}
export async function refresh(req, res) {
  return refreshSession(req, res);
}
export async function listSessions(user, currentSession) {
  const items = await Session.find({ userId: user._id })
    .sort({ lastUsedAt: -1 })
    .select('activeOrganizationId device browser ip createdAt expiresAt lastUsedAt')
    .lean();
  return items.map((session) => ({
    ...session,
    current: String(session._id) === String(currentSession._id),
  }));
}
export async function revokeOwnedSession(user, sessionId, currentSession, res) {
  const session = await revokeSession(user._id, sessionId);
  if (!session) throw new ApiError(404, 'Session not found.');
  if (String(session._id) === String(currentSession._id)) clearAuthCookies(res);
}
export async function sendVerification(input) {
  const email = (typeof input === 'string' ? input : input?.email || '').trim().toLowerCase();
  const user = await User.findOne({ email, emailVerified: false });
  if (user) await issueOtp(user, 'verification');
}
export async function verifyEmail(data, req, res) {
  const user = await consumeOtp(data.email, data.otp, 'verification');
  user.emailVerified = true;
  await user.save();
  const full = await User.findById(user._id).select('+sessionVersion');
  if (!full.isActive) throw new ApiError(403, 'This account is suspended.');
  await createSession(req, res, full);
  return full;
}
export async function requestPasswordReset(input) {
  const email = (typeof input === 'string' ? input : input?.email || '').trim().toLowerCase();
  const user = await User.findOne({ email, isActive: true }).select('+recovery');
  if (user && (!user.recovery?.sentAt || Date.now() - user.recovery.sentAt.getTime() > 60000))
    await issueOtp(user, 'recovery');
}
export async function verifyPasswordReset(data, res) {
  const user = await consumeOtp(data.email, data.otp, 'recovery');
  const token = crypto.randomBytes(32).toString('hex');
  await User.updateOne(
    { _id: user._id },
    { $set: { resetHash: hashToken(token), resetExpires: new Date(Date.now() + 600000) } },
  );
  res.cookie('creatoros_reset', token, { ...cookieOptions, maxAge: 600000 });
}
export async function resetPassword(data, req, res) {
  const token = req.cookies.creatoros_reset;
  if (!token) throw new ApiError(400, 'Verify your reset code first.');
  const user = await User.findOneAndUpdate(
    { resetHash: hashToken(token), resetExpires: { $gt: new Date() } },
    {
      $set: { password: await bcrypt.hash(data.password, 12), passwordChangedAt: new Date() },
      $inc: { sessionVersion: 1 },
      $unset: { resetHash: 1, resetExpires: 1, recovery: 1 },
    },
    { new: true },
  );
  if (!user) throw new ApiError(400, 'Reset authorization expired. Request a new code.');
  res.clearCookie('creatoros_reset', cookieOptions);
  await revokeUserSessions(user._id);
  clearAuthCookies(res);
  let notice = 'Password reset successfully. Please sign in.';
  try {
    await sendEmail(
      user.email,
      'Your password was changed',
      'Your CreatorOS password was changed. If you did not make this change, recover your account immediately.',
    );
  } catch {
    notice += ' The security email could not be delivered.';
  }
  return notice;
}
export async function updateAccount(userId, data) {
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
}
export async function changePassword(userId, data, req, res) {
  const user = await User.findById(userId).select('+password +sessionVersion');
  if (!user.password || !(await bcrypt.compare(data.currentPassword, user.password)))
    throw new ApiError(400, 'Current password is incorrect.');
  user.password = await bcrypt.hash(data.password, 12);
  user.sessionVersion += 1;
  user.passwordChangedAt = new Date();
  await user.save();
  await revokeUserSessions(user._id);
  await createSession(req, res, user);
}
export async function deleteAccount(userId) {
  await Promise.all(
    [...Object.values(models), Analytics, Activity, Profile].map((model) =>
      model.deleteMany({ owner: userId }),
    ),
  );
  await revokeUserSessions(userId);
  await User.deleteOne({ _id: userId });
}
export const registerUser = register;
export const loginUser = authenticate;
export const logoutUser = logout;
export const forgotPassword = requestPasswordReset;