import mongoose from 'mongoose';
import { DEAL_PAYMENT_STATUSES, DEAL_STATUSES } from './deal.constants.js';
const dealSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: DEAL_STATUSES,
      default: DEAL_STATUSES[0],
    },
    paymentStatus: {
      type: String,
      enum: DEAL_PAYMENT_STATUSES,
      default: DEAL_PAYMENT_STATUSES[0],
    },
    startDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    paymentDueDate: {
      type: Date,
    },
    deliverables: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    contract: {
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
dealSchema.pre('validate', function syncDealFields(next) {
  if (this.brandId && !this.brand) this.brand = this.brandId;
  if (this.brand && !this.brandId) this.brandId = this.brand;
  next();
});
dealSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
dealSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
dealSchema.index({ organizationId: 1, status: 1 });
dealSchema.index({ owner: 1, status: 1 });
dealSchema.index({ organizationId: 1, brand: 1 });
export const BrandDeal = mongoose.model('BrandDeal', dealSchema);
export const Deal = BrandDeal;
