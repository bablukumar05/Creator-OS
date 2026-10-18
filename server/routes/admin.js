import { Router } from 'express';
import { User } from '../models/User.js';
import { models, Activity } from '../models/resources.js';
import { authorize } from '../middleware/auth.js';
import { asyncRoute, ok, ApiError, escapeRegex, safeUser } from '../utils/http.js';
export const adminRouter = Router();
adminRouter.use(authorize('admin'));
adminRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    const [users, active, content, campaigns, revenue, activity] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, role: 'creator' }),
      models.content.countDocuments({ deletedAt: null }),
      models.campaigns.countDocuments({ deletedAt: null }),
      models.revenue.countDocuments({ deletedAt: null }),
      Activity.find().sort({ createdAt: -1 }).limit(20).select('title resource createdAt').lean(),
    ]);
    ok(res, { users, active, content, campaigns, revenue, activity });
  }),
);
adminRouter.get(
  '/users',
  asyncRoute(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1),
      filter = {};
    if (req.query.search)
      filter.$or = [
        { name: { $regex: escapeRegex(req.query.search), $options: 'i' } },
        { email: { $regex: escapeRegex(req.query.search), $options: 'i' } },
      ];
    if (['creator', 'admin'].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.active) filter.isActive = req.query.active === 'true';
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * 10)
        .limit(10),
      User.countDocuments(filter),
    ]);
    ok(res, { items: users.map(safeUser), total, page, pages: Math.ceil(total / 10) });
  }),
);
adminRouter.patch(
  '/users/:id',
  asyncRoute(async (req, res) => {
    if (typeof req.body.isActive !== 'boolean')
      throw new ApiError(400, 'Choose an account status.');
    const user = await User.findOne({ _id: req.params.id, role: 'creator' });
    if (!user) throw new ApiError(400, 'Only creator accounts can be managed here.');
    user.isActive = req.body.isActive;
    await User.updateOne(
      { _id: user._id },
      { $set: { isActive: user.isActive }, $inc: { sessionVersion: 1 } },
    );
    await Activity.create({
      owner: req.user._id,
      title: `${user.isActive ? 'Activated' : 'Suspended'} ${user.name}`,
      resource: 'users',
      resourceId: user._id,
    });
    ok(res, safeUser(user), 'Account status updated.');
  }),
);