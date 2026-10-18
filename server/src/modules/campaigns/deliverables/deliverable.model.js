import mongoose from 'mongoose';
import {
  CONTENT_TYPES,
  DELIVERABLE_PLATFORMS,
  DELIVERABLE_STATUSES,
} from '../campaign.constants.js';
const deliverableSchema = new mongoose.Schema(
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
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    platform: {
      type: String,
      enum: DELIVERABLE_PLATFORMS,
      default: 'Instagram',
    },
    contentType: {
      type: String,
      enum: CONTENT_TYPES,
      default: 'Reel',
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: DELIVERABLE_STATUSES,
      default: 'Pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
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
  },
  { timestamps: true },
);
deliverableSchema.index({ organizationId: 1, campaignId: 1 });
deliverableSchema.index({ organizationId: 1, dueDate: 1 });
deliverableSchema.index({ organizationId: 1, status: 1 });
export const Deliverable = mongoose.model('Deliverable', deliverableSchema);
