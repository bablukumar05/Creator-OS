import mongoose from 'mongoose';
import { COMMUNICATION_TYPES } from '../brand.constants.js';
const communicationSchema = new mongoose.Schema(
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
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: COMMUNICATION_TYPES,
      default: 'Email',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    nextFollowUp: {
      type: Date,
      default: null,
      index: true,
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
communicationSchema.index({ organizationId: 1, nextFollowUp: 1 });
communicationSchema.index({ organizationId: 1, brandId: 1, createdAt: -1 });
export const Communication = mongoose.model('Communication', communicationSchema);
