export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const asyncHandler = asyncRoute;
export const ok = (res, data = null, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });
export const sendSuccess = (res, arg2, arg3, arg4) => {
  if (typeof arg2 === 'number') {
    return res.status(arg2).json({ success: true, message: typeof arg4 === 'string' ? arg4 : 'Success', data: arg3 });
  }
  const status = typeof arg4 === 'number' ? arg4 : 200;
  return res.status(status).json({ success: true, message: typeof arg3 === 'string' ? arg3 : 'Success', data: arg2 });
};
export const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  emailVerified: user.emailVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
});
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');