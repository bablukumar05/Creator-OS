import mongoose from 'mongoose';
import { DOCUMENT_TYPES } from '../brand.constants.js';
const documentSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: 'Other',
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);
documentSchema.index({ organizationId: 1, brandId: 1, createdAt: -1 });
export const BrandDocument = mongoose.model('BrandDocument', documentSchema);
