import mongoose from 'mongoose';
import { platforms } from '../../../../shared/resources.js';
import { CONTENT_STATUSES, CONTENT_TYPES } from './content.constants.js';
const contentSchema = new mongoose.Schema(
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
    platform: {
      type: String,
      enum: platforms,
      default: platforms[0],
    },
    type: {
      type: String,
      enum: CONTENT_TYPES,
      default: CONTENT_TYPES[0],
    },
    contentType: {
      type: String,
      enum: CONTENT_TYPES,
      default: CONTENT_TYPES[0],
    },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: 'Idea',
    },
    publishDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    scheduledTime: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    hashtags: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    thumbnail: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    assets: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
      default: [],
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    views: {
      type: Number,
      min: 0,
      default: 0,
    },
    likes: {
      type: Number,
      min: 0,
      default: 0,
    },
    comments: {
      type: Number,
      min: 0,
      default: 0,
    },
    shares: {
      type: Number,
      min: 0,
      default: 0,
    },
    saves: {
      type: Number,
      min: 0,
      default: 0,
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
contentSchema.pre('validate', function syncContentFields(next) {
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  if (this.contentType && !this.type) this.type = this.contentType;
  if (this.type && !this.contentType) this.contentType = this.type;
  if (this.dueDate && !this.publishDate) this.publishDate = this.dueDate;
  if (this.publishDate && !this.dueDate) this.dueDate = this.publishDate;
  if (this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = this.publishDate || new Date();
  }
  next();
});
contentSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
contentSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
contentSchema.index({ organizationId: 1, status: 1 });
contentSchema.index({ owner: 1, status: 1 });
contentSchema.index({ organizationId: 1, campaign: 1 });
contentSchema.index({ organizationId: 1, assignedTo: 1 });
export const Content = mongoose.model('Content', contentSchema);
