import mongoose from 'mongoose';
const analyticsSnapshotSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['organization', 'campaign', 'creator', 'brand', 'finance', 'content'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    period: {
      type: String, 
      required: true,
      index: true,
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);
analyticsSnapshotSchema.index({ organizationId: 1, period: -1 });
analyticsSnapshotSchema.index({ organizationId: 1, entityType: 1, period: -1 });
const aiInsightSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['anomaly', 'opportunity', 'risk', 'recommendation'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['finance', 'campaigns', 'creators', 'brands', 'content'],
      required: true,
    },
    evidence: [String],
    recommendation: String,
    status: {
      type: String,
      enum: ['active', 'read', 'dismissed', 'resolved'],
      default: 'active',
    },
    expiresAt: Date,
  },
  { timestamps: true },
);
aiInsightSchema.index({ organizationId: 1, status: 1, severity: -1 });
const riskScoreSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['campaign', 'payment', 'creator'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetName: String,
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
    },
    factors: [
      {
        name: String,
        score: Number,
        impact: String,
        description: String,
      },
    ],
    lastAssessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);
riskScoreSchema.index({ organizationId: 1, targetType: 1, riskLevel: 1 });
const revenueForecastSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    period: {
      type: String, 
      required: true,
    },
    method: {
      type: String,
      enum: ['moving_average', 'weighted_moving_average', 'ai_assisted'],
      default: 'weighted_moving_average',
    },
    forecastRevenue: {
      type: Number,
      required: true,
    },
    bestCaseRevenue: Number,
    worstCaseRevenue: Number,
    confidenceScore: {
      type: Number,
      default: 85,
    },
    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);
const aiConversationSchema = new mongoose.Schema(
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
    },
    title: {
      type: String,
      default: 'New AI Intelligence Session',
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);
const aiMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'tool', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    toolCalls: [
      {
        toolName: String,
        args: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed,
      },
    ],
    visualization: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);
export const AnalyticsSnapshot = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
export const AIInsight = mongoose.model('AIInsight', aiInsightSchema);
export const RiskScore = mongoose.model('RiskScore', riskScoreSchema);
export const RevenueForecast = mongoose.model('RevenueForecast', revenueForecastSchema);
export const AIConversation = mongoose.model('AIConversation', aiConversationSchema);
export const AIMessage = mongoose.model('AIMessage', aiMessageSchema);
