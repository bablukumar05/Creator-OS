import mongoose from 'mongoose';
import { MEMBER_STATUSES, ORGANIZATION_ROLES } from './member.types.js';
const memberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    role: {
      type: String,
      enum: ORGANIZATION_ROLES,
      required: true,
      default: 'creator',
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: MEMBER_STATUSES,
      default: 'active',
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    inviteTokenHash: {
      type: String,
      select: false,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);
memberSchema.index(
  { organizationId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: 'objectId' } },
  },
);
memberSchema.index(
  { organizationId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' }, status: 'invited' },
  },
);
memberSchema.index({ userId: 1, status: 1 });
memberSchema.index({ organizationId: 1, status: 1, role: 1 });
export const Member = mongoose.model('Member', memberSchema);
