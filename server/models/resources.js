import mongoose from 'mongoose';
import { resources } from '../../shared/resources.js';
import { Brand } from '../src/modules/brands/brand.model.js';
import { Campaign } from '../src/modules/campaigns/campaign.model.js';
import { Content } from '../src/modules/content/content.model.js';
import { Contract } from '../src/modules/contracts/contract.model.js';
import { BrandDeal } from '../src/modules/deals/deal.model.js';
import { Expense, Revenue } from '../src/modules/finance/finance.model.js';
import { Invoice } from '../src/modules/invoices/invoice.model.js';
import { Task } from '../src/modules/tasks/task.model.js';
import { Brief } from '../src/modules/briefs/brief.model.js';
import { Asset } from '../src/modules/assets/asset.model.js';
import { Review } from '../src/modules/reviews/review.model.js';
import { Publishing } from '../src/modules/publishing/publishing.model.js';
import { CreatorProfile } from '../src/modules/creators/creator.model.js';
import { TalentMembership } from '../src/modules/talent/talent.model.js';
import {
  CampaignApplication,
  CampaignInvitation,
  CampaignOffer,
} from '../src/modules/marketplace/marketplace.model.js';
import { AnalyticsSnapshot, AIConversation } from '../src/modules/analytics/analytics.model.js';
const base = {
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deletedAt: { type: Date, default: null },
};
export const models = {
  brands: Brand,
  campaigns: Campaign,
  content: Content,
  contracts: Contract,
  deals: BrandDeal,
  invoices: Invoice,
  revenue: Revenue,
  expenses: Expense,
  tasks: Task,
  briefs: Brief,
  assets: Asset,
  reviews: Review,
  publishing: Publishing,
  creators: CreatorProfile,
  talent: TalentMembership,
  invitations: CampaignInvitation,
  applications: CampaignApplication,
  offers: CampaignOffer,
  analytics: AnalyticsSnapshot,
  ai: AIConversation,
};
for (const [key, config] of Object.entries(resources)) {
  if (
    [
      'brands',
      'campaigns',
      'content',
      'contracts',
      'deals',
      'invoices',
      'revenue',
      'expenses',
      'tasks',
      'briefs',
      'assets',
      'reviews',
      'publishing',
      'creators',
      'talent',
      'invitations',
      'applications',
      'offers',
      'analytics',
      'ai',
    ].includes(key)
  )
    continue;
  const fields = { ...base };
  for (const f of config.fields) {
    fields[f.key] =
      f.type === 'relation'
        ? { type: mongoose.Schema.Types.ObjectId, ref: resources[f.resource].model }
        : f.type === 'items'
          ? [
              {
                description: { type: String, required: true },
                quantity: { type: Number, min: 0.01, required: true },
                rate: { type: Number, min: 0, required: true },
              },
            ]
          : f.type === 'number'
            ? { type: Number, min: 0, default: 0 }
            : f.type === 'date'
              ? { type: Date, ...(f.key === 'date' ? { default: Date.now } : {}) }
              : f.type === 'checkbox'
                ? { type: Boolean, default: false }
                : {
                    type: String,
                    trim: true,
                    maxlength: f.type === 'textarea' ? 10000 : 500,
                    required: !!f.required,
                    ...(f.options ? { enum: f.options, default: f.options[0] } : {}),
                  };
  }
  if (key === 'invoices')
    Object.assign(fields, {
      number: { type: String, required: true },
      amount: { type: Number, min: 0 },
      subtotal: Number,
    });
  if (key === 'media')
    Object.assign(fields, {
      url: String,
      publicId: { type: String, select: false },
      size: Number,
      mime: String,
      resourceType: String,
    });
  const schema = new mongoose.Schema(fields, { timestamps: true });
  schema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
  schema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
  if (fields.status) {
    schema.index({ owner: 1, status: 1 });
    schema.index({ organizationId: 1, status: 1 });
  }
  if (key === 'invoices') {
    schema.index({ owner: 1, number: 1 }, { unique: true });
    schema.index(
      { organizationId: 1, number: 1 },
      { unique: true, partialFilterExpression: { organizationId: { $type: 'objectId' } } },
    );
  }
  models[key] = mongoose.model(config.model, schema);
}
const profile = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    bio: { type: String, maxlength: 2000 },
    username: { type: String, maxlength: 50 },
    niche: String,
    location: String,
    timezone: { type: String, maxlength: 100 },
    language: { type: String, maxlength: 20 },
    website: String,
    cover: String,
    currency: { type: String, enum: ['INR', 'USD', 'EUR', 'GBP'], default: 'INR' },
    socials: { type: Map, of: String },
    notifications: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Profile = mongoose.model('CreatorProfile', profile);
const analytics = new mongoose.Schema(
  {
    ...base,
    date: { type: Date, required: true },
    platform: String,
    followers: Number,
    views: Number,
    likes: Number,
    comments: Number,
    shares: Number,
    saves: Number,
    impressions: Number,
    reach: Number,
  },
  { timestamps: true },
);
analytics.index({ owner: 1, date: 1, platform: 1 }, { unique: true });
export const Analytics = mongoose.model('Analytics', analytics);
export const Activity = mongoose.model(
  'ActivityLog',
  new mongoose.Schema(
    { ...base, title: String, resource: String, resourceId: mongoose.Schema.Types.ObjectId },
    { timestamps: true },
  ),
);