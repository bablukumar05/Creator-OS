import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { CONTRACT_STATUSES, CONTRACT_TYPES } from './contract.constants.js';
const contractSchema = new mongoose.Schema(
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
    contractNumber: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    contractType: {
      type: String,
      enum: CONTRACT_TYPES,
      default: 'Campaign Agreement',
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
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
    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BrandDeal',
      default: null,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BrandDeal',
      default: null,
    },
    status: {
      type: String,
      enum: CONTRACT_STATUSES,
      default: 'Draft',
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    value: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP'],
      default: 'INR',
    },
    effectiveDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
      index: true,
    },
    signedAt: {
      type: Date,
    },
    signedBy: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    fileUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    terms: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    deliverables: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    signingToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    creatorSignature: {
      signedByName: { type: String, trim: true },
      signatureDataUrl: { type: String },
      signedAt: { type: Date },
      ipAddress: { type: String },
      userAgent: { type: String },
      documentHash: { type: String },
    },
    brandSignature: {
      signedByName: { type: String, trim: true },
      signerEmail: { type: String, lowercase: true, trim: true },
      signatureDataUrl: { type: String },
      signedAt: { type: Date },
      ipAddress: { type: String },
      userAgent: { type: String },
      documentHash: { type: String },
    },
    isFullyExecuted: {
      type: Boolean,
      default: false,
      index: true,
    },
    executedAt: {
      type: Date,
      default: null,
    },
    documentHash: {
      type: String,
      default: null,
    },
    auditTrail: [
      {
        event: { type: String, required: true },
        performedBy: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String },
        timestamp: { type: Date, default: Date.now },
        hash: { type: String },
      },
    ],
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
contractSchema.pre('validate', function syncContractFields(next) {
  if (this.brandId && !this.brand) this.brand = this.brandId;
  if (this.brand && !this.brandId) this.brandId = this.brand;
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  if (this.dealId && !this.deal) this.deal = this.dealId;
  if (this.deal && !this.dealId) this.dealId = this.deal;
  if (typeof this.value === 'number' && this.amount === 0) this.amount = this.value;
  if (typeof this.amount === 'number' && this.value === 0) this.value = this.amount;
  if (this.status === 'Signed' && !this.signedAt) {
    this.signedAt = new Date();
  }
  if (!this.contractNumber) {
    this.contractNumber = `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.signingToken) {
    this.signingToken = `sign_tok_${crypto.randomBytes(16).toString('hex')}`;
  }
  next();
});
contractSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
contractSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
contractSchema.index({ organizationId: 1, status: 1 });
contractSchema.index({ organizationId: 1, expirationDate: 1 });
contractSchema.index({ owner: 1, status: 1 });
contractSchema.index({ organizationId: 1, brand: 1 });
contractSchema.index({ organizationId: 1, campaign: 1 });
export const Contract = mongoose.model('Contract', contractSchema);
