import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 2000 },
    amount: { type: Number, required: true, min: 1 },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending_deposit', 'funded', 'submitted', 'approved', 'released', 'disputed'],
      default: 'pending_deposit',
      index: true,
    },
    deliverableUrl: { type: String, trim: true },
    deliverableNotes: { type: String, trim: true, maxlength: 3000 },
    fundedAt: { type: Date },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    releasedAt: { type: Date },
    disputeReason: { type: String, trim: true, maxlength: 2000 },
    disputeRaisedAt: { type: Date },
    disputeResolvedAt: { type: Date },
    disputeResolution: { type: String, enum: ['released_to_creator', 'refunded_to_brand', null], default: null },
  },
  { _id: true, timestamps: true },
);

const escrowAccountSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    brandName: { type: String, trim: true },
    clientEmail: { type: String, lowercase: true, trim: true },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
      default: null,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    heldAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    releasedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    milestones: {
      type: [milestoneSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['unfunded', 'partially_funded', 'funded', 'completed', 'disputed'],
      default: 'unfunded',
      index: true,
    },
    terms: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

escrowAccountSchema.index({ organizationId: 1, createdAt: -1 });
escrowAccountSchema.index({ organizationId: 1, status: 1 });

export const EscrowAccount = mongoose.model('EscrowAccount', escrowAccountSchema);
