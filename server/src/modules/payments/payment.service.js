import { Payment } from './payment.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { Organization } from '../organizations/organization.model.js';
import { User } from '../auth/auth.model.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError } from '../../../utils/http.js';
import {
  createStripeCheckoutSession,
  createRazorpayOrder,
  verifyRazorpaySignature,
  getGatewayConfig,
} from './gateway.service.js';

export async function listPayments(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  };
  if (req.query.invoiceId) criteria.invoiceId = req.query.invoiceId;
  const items = await Payment.find(criteria)
    .sort({ paidAt: -1, createdAt: -1 })
    .populate('invoiceId', 'number title amount status')
    .lean();
  return { items, total: items.length };
}

export async function getPaymentById(req, paymentId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const payment = await Payment.findOne({
    _id: paymentId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  }).lean();
  if (!payment) throw new ApiError(404, 'Payment record not found.');
  return payment;
}

export async function createPayment(req, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const invoice = await Invoice.findOne({
    _id: payload.invoiceId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  const payment = await Payment.create({
    ...payload,
    organizationId: req.organizationId,
    owner: ownerId,
    createdBy: req.user._id,
  });
  const paymentsSum = await Payment.aggregate([
    { $match: { invoiceId: invoice._id } },
    { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
  ]);
  const totalPaid = paymentsSum[0]?.totalPaid || 0;
  invoice.paidAmount = totalPaid;
  invoice.remainingAmount = Math.max(0, invoice.amount - totalPaid);
  if (invoice.remainingAmount === 0) {
    invoice.status = 'Paid';
  } else {
    invoice.status = 'Partially Paid';
  }
  await invoice.save();
  await recordActivity(req, `Payment recorded for ${invoice.number}`, 'invoices', invoice._id);
  return payment;
}

export async function deletePayment(req, paymentId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const payment = await Payment.findOneAndDelete({
    _id: paymentId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!payment) throw new ApiError(404, 'Payment record not found.');
  const invoice = await Invoice.findById(payment.invoiceId);
  if (invoice) {
    const paymentsSum = await Payment.aggregate([
      { $match: { invoiceId: invoice._id } },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
    ]);
    const totalPaid = paymentsSum[0]?.totalPaid || 0;
    invoice.paidAmount = totalPaid;
    invoice.remainingAmount = Math.max(0, invoice.amount - totalPaid);
    if (invoice.paidAmount === 0) {
      invoice.status = 'Sent';
    } else if (invoice.remainingAmount === 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }
    await invoice.save();
  }
  return { success: true, message: 'Payment record deleted.' };
}

export async function getPublicInvoice(invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, deletedAt: null })
    .populate('brandId', 'name title logo website')
    .lean();

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found or no longer available.');
  }

  let organization = null;
  if (invoice.organizationId) {
    organization = await Organization.findById(invoice.organizationId)
      .select('name slug logo website settings')
      .lean();
  }

  let creator = null;
  if (invoice.owner) {
    creator = await User.findById(invoice.owner).select('name avatar email').lean();
  }

  return {
    _id: invoice._id,
    number: invoice.number,
    title: invoice.title,
    date: invoice.date,
    dueDate: invoice.dueDate,
    status: invoice.status,
    items: invoice.items || [],
    subtotal: invoice.subtotal || 0,
    discount: invoice.discount || 0,
    tax: invoice.tax || 0,
    taxAmount: invoice.taxAmount || 0,
    cgstAmount: invoice.cgstAmount || 0,
    sgstAmount: invoice.sgstAmount || 0,
    igstAmount: invoice.igstAmount || 0,
    amount: invoice.amount || 0,
    totalAmount: invoice.totalAmount || invoice.amount || 0,
    paidAmount: invoice.paidAmount || 0,
    remainingAmount: invoice.remainingAmount || Math.max(0, (invoice.amount || 0) - (invoice.paidAmount || 0)),
    notes: invoice.notes,
    clientEmail: invoice.clientEmail,
    clientAddress: invoice.clientAddress,
    brand: invoice.brandId || null,
    organization: organization || { name: 'CreatorOS Workspace' },
    creator: creator || { name: 'Creator' },
    gatewayConfig: getGatewayConfig(),
  };
}

export async function createPublicCheckout(invoiceId, payload, originUrl) {
  const invoice = await Invoice.findOne({ _id: invoiceId, deletedAt: null });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');

  const remaining = invoice.remainingAmount > 0
    ? invoice.remainingAmount
    : Math.max(0, invoice.amount - (invoice.paidAmount || 0));

  if (remaining <= 0) {
    throw new ApiError(400, 'This invoice has already been fully paid.');
  }

  const provider = payload.provider || 'razorpay';
  const currency = payload.currency || 'INR';

  if (provider === 'stripe') {
    const successUrl = `${originUrl}/pay/${invoice._id}?payment_status=success`;
    const cancelUrl = `${originUrl}/pay/${invoice._id}?payment_status=cancelled`;
    const session = await createStripeCheckoutSession({
      amount: remaining,
      currency,
      invoiceId: invoice._id,
      invoiceNumber: invoice.number,
      customerEmail: invoice.clientEmail,
      successUrl,
      cancelUrl,
      description: `Payment for Invoice #${invoice.number}`,
    });
    return session;
  }

  const order = await createRazorpayOrder({
    amount: remaining,
    currency,
    invoiceId: invoice._id,
    invoiceNumber: invoice.number,
    notes: { clientEmail: invoice.clientEmail || '' },
  });
  return order;
}

export async function verifyPublicPayment(payload, io) {
  const { invoiceId, provider, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, paymentMethod } = payload;
  const invoice = await Invoice.findOne({ _id: invoiceId, deletedAt: null });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');

  if (provider === 'razorpay') {
    const valid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      throw new ApiError(400, 'Invalid payment signature verification failed.');
    }
  }

  const paidAmount = Number(amount) || invoice.remainingAmount || invoice.amount;
  const payment = await Payment.create({
    organizationId: invoice.organizationId || invoice.owner,
    owner: invoice.owner,
    invoiceId: invoice._id,
    amount: paidAmount,
    paymentMethod: paymentMethod || (provider === 'stripe' ? 'Stripe' : 'Razorpay'),
    transactionId: razorpay_payment_id || `sim_${Date.now()}`,
    paidAt: new Date(),
    notes: `Settled via ${provider.toUpperCase()} online portal`,
  });

  invoice.paidAmount = (invoice.paidAmount || 0) + paidAmount;
  invoice.remainingAmount = Math.max(0, (invoice.amount || 0) - invoice.paidAmount);
  if (invoice.remainingAmount === 0) {
    invoice.status = 'Paid';
  } else {
    invoice.status = 'Partially Paid';
  }
  await invoice.save();

  if (io && invoice.owner) {
    io.to(String(invoice.owner)).emit('payment-received', {
      invoiceId: String(invoice._id),
      invoiceNumber: invoice.number,
      amount: paidAmount,
      paidAt: payment.paidAt,
      status: invoice.status,
    });
  }

  return {
    success: true,
    message: 'Payment received and verified successfully!',
    invoice: {
      _id: invoice._id,
      status: invoice.status,
      paidAmount: invoice.paidAmount,
      remainingAmount: invoice.remainingAmount,
    },
    payment,
  };
}
