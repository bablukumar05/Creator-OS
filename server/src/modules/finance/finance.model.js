import mongoose from 'mongoose';
import { platforms } from '../../../../shared/resources.js';
import {
  EXPENSE_CATEGORIES,
  REVENUE_CATEGORIES,
  REVENUE_STATUSES,
} from './finance.constants.js';
const revenueSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      enum: REVENUE_CATEGORIES,
      default: REVENUE_CATEGORIES[0],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    platform: {
      type: String,
      enum: platforms,
      default: platforms[0],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    status: {
      type: String,
      enum: REVENUE_STATUSES,
      default: REVENUE_STATUSES[0],
    },
    paymentMethod: {
      type: String,
      trim: true,
      maxlength: 500,
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
revenueSchema.pre('validate', function syncRevenueFields(next) {
  if (this.brandId && !this.brand) this.brand = this.brandId;
  if (this.brand && !this.brandId) this.brandId = this.brand;
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  next();
});
revenueSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
revenueSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
revenueSchema.index({ organizationId: 1, status: 1 });
revenueSchema.index({ owner: 1, status: 1 });
revenueSchema.index({ organizationId: 1, campaign: 1 });
export const Revenue = mongoose.model('Revenue', revenueSchema);
const expenseSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: EXPENSE_CATEGORIES[0],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    receipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
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
expenseSchema.pre('validate', function syncExpenseFields(next) {
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  next();
});
expenseSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
expenseSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
expenseSchema.index({ organizationId: 1, category: 1 });
expenseSchema.index({ organizationId: 1, campaign: 1 });
export const Expense = mongoose.model('Expense', expenseSchema);
