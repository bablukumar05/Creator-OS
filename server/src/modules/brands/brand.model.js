import mongoose from 'mongoose';
import {
  BRAND_PRIORITIES,
  BRAND_SOURCES,
  BRAND_STATUSES,
  COMPANY_SIZES,
} from './brand.constants.js';
const brandContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, trim: true, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 50 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true },
);
const brandSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    logo: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    companySize: {
      type: String,
      enum: COMPANY_SIZES,
      default: '1-10',
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: BRAND_STATUSES,
      default: 'Lead',
      index: true,
    },
    source: {
      type: String,
      enum: BRAND_SOURCES,
      default: 'Inbound',
    },
    priority: {
      type: String,
      enum: BRAND_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    contacts: {
      type: [brandContactSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);
brandSchema.pre('validate', function syncBrandNameAndTitle(next) {
  if (this.name && !this.title) this.title = this.name;
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});
brandSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
brandSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
brandSchema.index({ organizationId: 1, name: 1 });
brandSchema.index({ organizationId: 1, status: 1 });
brandSchema.index({ organizationId: 1, assignedTo: 1 });
brandSchema.index({ organizationId: 1, priority: 1 });
brandSchema.index({ owner: 1, status: 1 });
export const Brand = mongoose.model('Brand', brandSchema);
