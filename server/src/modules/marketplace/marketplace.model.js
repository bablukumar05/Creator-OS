import mongoose from 'mongoose';
const campaignInvitationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
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
      ref: 'CreatorProfileModel',
      required: true,
      index: true,
    },
    proposedBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    deliverables: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined', 'Expired', 'Negotiation'],
      default: 'Pending',
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);
const campaignApplicationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfileModel',
      required: true,
      index: true,
    },
    proposal: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    proposedPrice: {
      type: Number,
      min: 0,
      required: true,
    },
    portfolio: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Pending', 'Shortlisted', 'Accepted', 'Rejected'],
      default: 'Pending',
      index: true,
    },
  },
  { timestamps: true },
);
const campaignOfferSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfileModel',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      min: 0,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    deliverables: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Countered', 'Accepted', 'Rejected', 'Expired'],
      default: 'Sent',
      index: true,
    },
  },
  { timestamps: true },
);
const creatorReviewSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfileModel',
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    contentQualityScore: { type: Number, min: 1, max: 5, default: 5 },
    communicationScore: { type: Number, min: 1, max: 5, default: 5 },
    timelinessScore: { type: Number, min: 1, max: 5, default: 5 },
    reviewText: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);
const campaignCreatorSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
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
      ref: 'CreatorProfileModel',
      required: true,
      index: true,
    },
    agreedAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    deliverables: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Assigned', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Assigned',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);
campaignCreatorSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });
export const CampaignInvitation = mongoose.model('CampaignInvitation', campaignInvitationSchema);
export const CampaignApplication = mongoose.model('CampaignApplication', campaignApplicationSchema);
export const CampaignOffer = mongoose.model('CampaignOffer', campaignOfferSchema);
export const CreatorReview = mongoose.model('CreatorReview', creatorReviewSchema);
export const CampaignCreator = mongoose.model('CampaignCreator', campaignCreatorSchema);
