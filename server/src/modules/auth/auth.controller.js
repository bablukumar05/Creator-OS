import * as service from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  otpSchema,
  resetPasswordSchema,
  updateAccountSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from './auth.validation.js';
import { ok, safeUser } from '../../../utils/http.js';

export async function register(req, res) {
  const result = await service.registerUser(registerSchema.parse(req.body), req, res);
  ok(res, { user: safeUser(result.user), organization: result.organization }, result.message, 201);
}

export async function login(req, res) {
  const result = await service.loginUser(loginSchema.parse(req.body), req, res);
  ok(res, { user: safeUser(result.user), organization: result.organization, token: result.token }, 'Signed in successfully.');
}

export async function logout(req, res) {
  await service.logout(req.user, req.session, res);
  ok(res, null, 'Signed out successfully.');
}

export async function refresh(req, res) {
  const { user, token } = await service.refresh(req, res);
  ok(res, { ...safeUser(user), token }, 'Session refreshed.');
}

export async function forgotPassword(req, res) {
  await service.forgotPassword(forgotPasswordSchema.parse(req.body), req);
  ok(res, null, 'If an account exists for this email, a reset code has been sent.');
}

export async function verifyEmail(req, res) {
  const user = await service.verifyEmail(otpSchema.parse(req.body), req, res);
  ok(res, safeUser(user), 'Email verified.');
}

export async function resendVerification(req, res) {
  await service.sendVerification(req.body.email);
  ok(res, null, 'If an account exists, a new code has been sent.');
}

export async function resendReset(req, res) {
  await service.requestPasswordReset(req.body.email);
  ok(res, null, 'If an account exists, a new code has been sent.');
}

export async function verifyReset(req, res) {
  await service.verifyPasswordReset(otpSchema.parse(req.body), res);
  ok(res, null, 'Code verified. Choose a new password.');
}

export async function resetPassword(req, res) {
  const notice = await service.resetPassword(resetPasswordSchema.parse(req.body), req, res);
  ok(res, null, notice);
}

export async function listSessions(req, res) {
  const items = await service.listSessions(req.user, req.session);
  ok(res, { items });
}

export async function deleteSession(req, res) {
  await service.revokeOwnedSession(req.user, req.params.id, req.session, res);
  ok(res, null, 'Session revoked.');
}

export async function updateAccount(req, res) {
  const user = await service.updateAccount(req.user._id, updateAccountSchema.parse(req.body));
  ok(res, safeUser(user), 'Account updated.');
}

export async function changePassword(req, res) {
  await service.changePassword(req.user._id, changePasswordSchema.parse(req.body), req, res);
  ok(res, null, 'Password updated. Other sessions were signed out.');
}

export async function deleteAccount(req, res) {
  deleteAccountSchema.parse(req.body);
  await service.deleteAccount(req.user._id);
  ok(res, null, 'Account deleted.');
}