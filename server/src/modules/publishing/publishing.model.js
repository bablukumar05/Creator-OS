import mongoose from 'mongoose';
import { platforms } from '../../../../shared/resources.js';
const publishingSchema = new mongoose.Schema(
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
    platform: {
      type: String,
      enum: platforms,
      default: platforms[0],
    },
    publishDate: {
      type: Date,
      required: true,
      index: true,
    },
    publishedUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Publishing', 'Published', 'Failed'],
      default: 'Scheduled',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    publisherId: {
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
publishingSchema.pre('validate', function syncPublishingFields(next) {
  if (this.contentId && !this.content) this.content = this.contentId;
  if (this.content && !this.contentId) this.contentId = this.content;
  next();
});
publishingSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
publishingSchema.index({ organizationId: 1, publishDate: 1 });
publishingSchema.index({ organizationId: 1, status: 1 });
export const Publishing = mongoose.model('Publishing', publishingSchema);
