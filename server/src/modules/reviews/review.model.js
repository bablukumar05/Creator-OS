import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema(
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
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Number, 
      min: 0,
      default: 0,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['Pending', 'Changes Requested', 'Approved', 'Resolved'],
      default: 'Pending',
    },
    timecodeFormatted: {
      type: String,
      default: '00:00',
    },
    drawingData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    authorName: {
      type: String,
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
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
reviewSchema.pre('validate', function syncReviewFields(next) {
  if (this.contentId && !this.content) this.content = this.contentId;
  if (this.content && !this.contentId) this.contentId = this.content;
  if (this.assetId && !this.asset) this.asset = this.assetId;
  if (this.asset && !this.assetId) this.assetId = this.asset;
  next();
});
reviewSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
reviewSchema.index({ organizationId: 1, contentId: 1 });
reviewSchema.index({ organizationId: 1, assetId: 1 });
export const Review = mongoose.model('Review', reviewSchema);
