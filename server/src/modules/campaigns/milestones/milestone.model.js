import mongoose from 'mongoose';
import { MILESTONE_STATUSES } from '../campaign.constants.js';
const milestoneSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: MILESTONE_STATUSES,
      default: 'Pending',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);
milestoneSchema.index({ organizationId: 1, campaignId: 1, dueDate: 1 });
export const Milestone = mongoose.model('Milestone', milestoneSchema);
