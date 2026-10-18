import mongoose from 'mongoose';
import { platforms } from '../../../../shared/resources.js';
const creatorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 100,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    profileImage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    coverImage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    niches: {
      type: [String],
      default: [],
      index: true,
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
      index: true,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    contentTypes: {
      type: [String],
      default: [],
    },
    platforms: {
      type: [String],
      default: [],
      index: true,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    featuredVideoUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    highlights: [
      {
        label: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    pastCollaborations: [
      {
        brandName: { type: String, trim: true },
        logo: { type: String, trim: true },
        deliverableType: { type: String, trim: true },
        views: { type: String, trim: true },
        date: { type: String, trim: true },
        testimonial: { type: String, trim: true },
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationLevel: {
      type: String,
      enum: ['Unverified', 'Email Verified', 'Social Verified', 'Identity Verified', 'Professional Verified'],
      default: 'Social Verified',
    },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'Busy', 'Unavailable', 'On Leave'],
      default: 'Available',
      index: true,
    },
    minimumBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5.0,
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    onTimeRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);
creatorProfileSchema.index({ categories: 1, country: 1 });
creatorProfileSchema.index({ isPublic: 1, availabilityStatus: 1 });
const socialAccountSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfile',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: platforms,
      required: true,
    },
    username: {
      type: String,
      trim: true,
    },
    profileUrl: {
      type: String,
      trim: true,
    },
    followers: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },
    following: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalPosts: {
      type: Number,
      min: 0,
      default: 0,
    },
    engagementRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);
socialAccountSchema.index({ creatorId: 1, platform: 1 }, { unique: true });
const metricSnapshotSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfile',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: platforms,
      required: true,
    },
    followers: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    capturedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);
const rateCardSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfile',
      required: true,
      unique: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    minimumBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    negotiable: {
      type: Boolean,
      default: true,
    },
    services: [
      {
        platform: { type: String, enum: platforms, required: true },
        contentType: { type: String, required: true },
        basePrice: { type: Number, min: 0, required: true },
        turnaroundDays: { type: Number, min: 1, default: 3 },
      },
    ],
  },
  { timestamps: true },
);
export const CreatorProfile = mongoose.model('CreatorProfileModel', creatorProfileSchema);
export const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);
export const MetricSnapshot = mongoose.model('MetricSnapshot', metricSnapshotSchema);
export const RateCard = mongoose.model('RateCard', rateCardSchema);
