import mongoose from 'mongoose';
const otp = new mongoose.Schema(
  { hash: String, expires: Date, attempts: { type: Number, default: 0 }, sentAt: Date },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    password: { type: String, select: false },
    avatar: String,
    role: { type: String, enum: ['creator', 'admin'], default: 'creator' },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    facebookId: String,
    sessionVersion: { type: Number, default: 0, select: false },
    verification: { type: otp, select: false },
    recovery: { type: otp, select: false },
    resetHash: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    passwordChangedAt: Date,
    lastLogin: Date,
  },
  { timestamps: true },
);
for (const key of ['email', 'phone', 'facebookId'])
  schema.index(
    { [key]: 1 },
    { unique: true, partialFilterExpression: { [key]: { $type: 'string', $gt: '' } } },
  );
export const User = mongoose.model('User', schema);