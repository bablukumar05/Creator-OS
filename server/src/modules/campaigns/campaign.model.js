import mongoose from 'mongoose';
import { platforms } from '../../../../shared/resources.js';
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_PRIORITIES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
} from './campaign.constants.js';
const campaignSchema = new mongoose.Schema(
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
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    objective: {
      type: String,
      enum: CAMPAIGN_OBJECTIVES,
      default: 'Brand Awareness',
    },
    campaignType: {
      type: String,
      enum: CAMPAIGN_TYPES,
      default: 'Sponsorship',
    },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      default: 'Planning',
      index: true,
    },
    priority: {
      type: String,
      enum: CAMPAIGN_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    spentBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    remainingBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP'],
      default: 'INR',
    },
    platform: {
      type: String,
      enum: platforms,
      default: platforms[0],
    },
    deliverables: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedMembers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    tags: {
      type: [String],
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
campaignSchema.pre('validate', function syncCampaignFields(next) {
  if (this.name && !this.title) this.title = this.name;
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  if (this.brandId && !this.brand) this.brand = this.brandId;
  if (this.brand && !this.brandId) this.brandId = this.brand;
  if (typeof this.budget === 'number') {
    if (this.amount === 0) this.amount = this.budget;
    this.remainingBudget = Math.max(0, this.budget - (this.spentBudget || 0));
  }
  next();
});
campaignSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
campaignSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
campaignSchema.index({ organizationId: 1, brandId: 1 });
campaignSchema.index({ organizationId: 1, status: 1 });
campaignSchema.index({ organizationId: 1, managerId: 1 });
campaignSchema.index({ owner: 1, status: 1 });
export const Campaign = mongoose.model('Campaign', campaignSchema);
