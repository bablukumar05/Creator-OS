import mongoose from 'mongoose';
import {
  ORGANIZATION_CURRENCIES,
  ORGANIZATION_STATUSES,
  ORGANIZATION_TYPES,
} from './organization.types.js';
const settingsSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      enum: ORGANIZATION_CURRENCIES,
      default: 'INR',
    },
    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Asia/Kolkata',
    },
    language: {
      type: String,
      trim: true,
      maxlength: 20,
      default: 'en',
    },
  },
  { _id: false },
);
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ORGANIZATION_TYPES,
      default: 'creator_workspace',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    logo: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    settings: {
      type: settingsSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ORGANIZATION_STATUSES,
      default: 'active',
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ ownerId: 1, deletedAt: 1, createdAt: -1 });
organizationSchema.index({ status: 1, deletedAt: 1 });
export const Organization = mongoose.model('Organization', organizationSchema);
