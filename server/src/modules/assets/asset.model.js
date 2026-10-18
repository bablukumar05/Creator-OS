import mongoose from 'mongoose';
import { ASSET_TYPES } from './asset.constants.js';
const versionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    fileUrl: { type: String, required: true, trim: true },
    fileSize: { type: Number, min: 0, default: 0 },
    mimeType: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true, timestamps: true },
);
const assetSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ASSET_TYPES,
      default: 'Raw Video',
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    fileSize: {
      type: Number,
      min: 0,
      default: 0,
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    fileKey: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    storageProvider: {
      type: String,
      enum: ['s3', 'r2', 'cloudinary', 'local'],
      default: 's3',
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    versions: {
      type: [versionSchema],
      default: [],
    },
    uploadedBy: {
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
assetSchema.pre('validate', function syncAssetFields(next) {
  if (this.contentId && !this.content) this.content = this.contentId;
  if (this.content && !this.contentId) this.contentId = this.content;
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  next();
});
assetSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
assetSchema.index({ organizationId: 1, contentId: 1 });
assetSchema.index({ organizationId: 1, campaignId: 1 });
export const Asset = mongoose.model('Asset', assetSchema);
