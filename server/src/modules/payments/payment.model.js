import mongoose from 'mongoose';
const PAYMENT_METHODS = [
  'UPI',
  'Bank Transfer',
  'Razorpay',
  'Stripe',
  'PayPal',
  'Cash',
  'Cheque',
];
const paymentSchema = new mongoose.Schema(
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
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'Bank Transfer',
    },
    transactionId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentProof: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);
paymentSchema.index({ organizationId: 1, invoiceId: 1 });
paymentSchema.index({ organizationId: 1, paidAt: -1 });
export const Payment = mongoose.model('Payment', paymentSchema);
export { PAYMENT_METHODS };
