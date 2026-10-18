import mongoose from 'mongoose';
const briefSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    objective: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    audience: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    keyMessage: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    deliverables: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    references: {
      type: [String],
      default: [],
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
briefSchema.pre('validate', function syncBriefFields(next) {
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  if (this.contentId && !this.content) this.content = this.contentId;
  if (this.content && !this.contentId) this.contentId = this.content;
  next();
});
briefSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
briefSchema.index({ organizationId: 1, campaignId: 1 });
briefSchema.index({ organizationId: 1, contentId: 1 });
export const Brief = mongoose.model('Brief', briefSchema);
