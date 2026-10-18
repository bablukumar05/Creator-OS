import mongoose from 'mongoose';
import { TASK_PRIORITIES, TASK_STATUSES } from './task.constants.js';
const taskSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: TASK_STATUSES[0],
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: TASK_PRIORITIES[0],
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    category: {
      type: String,
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
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      default: null,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
taskSchema.pre('validate', function syncTaskFields(next) {
  if (this.brandId && !this.brand) this.brand = this.brandId;
  if (this.brand && !this.brandId) this.brandId = this.brand;
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  if (this.contentId && !this.content) this.content = this.contentId;
  if (this.content && !this.contentId) this.contentId = this.content;
  if (this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});
taskSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
taskSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
taskSchema.index({ organizationId: 1, status: 1 });
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ organizationId: 1, campaign: 1 });
taskSchema.index({ organizationId: 1, assignedTo: 1 });
export const Task = mongoose.model('Task', taskSchema);
