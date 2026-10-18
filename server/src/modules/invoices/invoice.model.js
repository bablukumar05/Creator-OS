import mongoose from 'mongoose';
import { INVOICE_STATUSES } from './invoice.constants.js';
const invoiceItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 500 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    quantity: { type: Number, min: 0.01, required: true },
    rate: { type: Number, min: 0, required: true },
    amount: { type: Number, min: 0, default: 0 },
  },
  { _id: true },
);
const invoiceSchema = new mongoose.Schema(
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
    number: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
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
    clientEmail: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 500,
    },
    clientAddress: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'Draft',
      index: true,
    },
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    tax: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    igstAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    tdsRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tdsAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    subtotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paidAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 10000,
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
invoiceSchema.pre('validate', function syncInvoiceFields(next) {
  if (this.brandId && !this.brand) this.brand = this.brandId;
  if (this.brand && !this.brandId) this.brandId = this.brand;
  if (this.campaignId && !this.campaign) this.campaign = this.campaignId;
  if (this.campaign && !this.campaignId) this.campaignId = this.campaign;
  if (Array.isArray(this.items) && this.items.length > 0) {
    let computedSubtotal = 0;
    for (const item of this.items) {
      if (!item.description && item.title) item.description = item.title;
      item.amount = (item.quantity || 0) * (item.rate || 0);
      computedSubtotal += item.amount;
    }
    if (computedSubtotal > 0) this.subtotal = computedSubtotal;
  }
  const taxableSubtotal = Math.max(0, (this.subtotal || 0) - (this.discount || 0));
  const taxPercent = this.tax || 0;
  this.taxAmount = (taxableSubtotal * taxPercent) / 100;
  this.cgstAmount = (taxableSubtotal * (taxPercent / 2)) / 100;
  this.sgstAmount = (taxableSubtotal * (taxPercent / 2)) / 100;
  this.igstAmount = this.taxAmount;
  if (this.tdsRate > 0) {
    this.tdsAmount = (taxableSubtotal * this.tdsRate) / 100;
  }
  if (taxableSubtotal > 0) {
    this.amount = taxableSubtotal + this.taxAmount;
  }
  if (!this.totalAmount && this.amount > 0) {
    this.totalAmount = this.amount;
  } else if (this.totalAmount > 0 && (!this.amount || this.amount === 0)) {
    this.amount = this.totalAmount;
  }
  this.remainingAmount = Math.max(0, (this.amount || this.totalAmount || 0) - (this.paidAmount || 0));
  if (!this.isModified('status')) {
    if (this.paidAmount > 0 && this.remainingAmount === 0) {
      this.status = 'Paid';
    } else if (this.paidAmount > 0 && this.remainingAmount > 0) {
      this.status = 'Partially Paid';
    }
  }
  next();
});
invoiceSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 });
invoiceSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });
invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ organizationId: 1, dueDate: 1 });
invoiceSchema.index({ organizationId: 1, brandId: 1 });
invoiceSchema.index({ owner: 1, status: 1 });
invoiceSchema.index({ owner: 1, number: 1 }, { unique: true });
invoiceSchema.index(
  { organizationId: 1, number: 1 },
  { unique: true, partialFilterExpression: { organizationId: { $type: 'objectId' } } },
);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
