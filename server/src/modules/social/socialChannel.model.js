import mongoose from 'mongoose';

const recentContentSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    publishedAt: { type: Date, default: Date.now },
    platform: { type: String, required: true },
  },
  { _id: true },
);

const socialChannelSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['youtube', 'instagram', 'tiktok', 'linkedin', 'twitter'],
      required: true,
      index: true,
    },
    platformAccountId: {
      type: String,
      required: true,
    },
    accountHandle: {
      type: String,
      required: true,
      trim: true,
    },
    channelTitle: {
      type: String,
      required: true,
      trim: true,
    },
    channelUrl: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    encryptedAccessToken: {
      type: String,
      default: '',
    },
    encryptedRefreshToken: {
      type: String,
      default: '',
    },
    tokenExpiresAt: {
      type: Date,
      default: null,
    },
    iv: {
      type: String,
      default: '',
    },
    authTag: {
      type: String,
      default: '',
    },
    channelStats: {
      subscriberCount: { type: Number, default: 0 },
      followerCount: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
      videoCount: { type: Number, default: 0 },
      mediaCount: { type: Number, default: 0 },
      averageEngagementRate: { type: Number, default: 0 },
    },
    recentContent: {
      type: [recentContentSchema],
      default: [],
    },
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'error'],
      default: 'idle',
    },
    syncError: {
      type: String,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

socialChannelSchema.index({ organizationId: 1, platform: 1, platformAccountId: 1 }, { unique: true });
socialChannelSchema.index({ organizationId: 1, isActive: 1 });

export const SocialChannel = mongoose.model('SocialChannel', socialChannelSchema);
