import crypto from 'node:crypto';
import Stripe from 'stripe';
import Razorpay from 'razorpay';

const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);
const hasRazorpay = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const stripe = hasStripe ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const razorpay = hasRazorpay
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

export function getGatewayConfig() {
  return {
    hasStripe,
    hasRazorpay,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_simulated_creatoros',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulated_creatoros',
    currency: process.env.DEFAULT_CURRENCY || 'INR',
    isSimulation: !hasStripe && !hasRazorpay,
  };
}

export async function createStripeCheckoutSession({
  amount,
  currency = 'inr',
  invoiceId,
  invoiceNumber,
  customerEmail,
  successUrl,
  cancelUrl,
  description = 'CreatorOS Invoice Payment',
}) {
  const normalizedCurrency = currency.toLowerCase();
  // convert amount to lowest currency unit (paise / cents)
  const unitAmount = Math.round(amount * 100);

  if (hasStripe && stripe) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: normalizedCurrency,
            product_data: {
              name: `Invoice #${invoiceNumber}`,
              description,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(invoiceId),
      metadata: { invoiceId: String(invoiceId), invoiceNumber },
    });
    return {
      provider: 'stripe',
      sessionId: session.id,
      checkoutUrl: session.url,
      isSimulated: false,
    };
  }

  const simulatedSessionId = `cs_test_${crypto.randomBytes(16).toString('hex')}`;
  return {
    provider: 'stripe',
    sessionId: simulatedSessionId,
    checkoutUrl: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id=${simulatedSessionId}&simulated=true`,
    isSimulated: true,
  };
}

export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  invoiceId,
  invoiceNumber,
  notes = {},
}) {
  const normalizedAmount = Math.round(amount * 100);

  if (hasRazorpay && razorpay) {
    const order = await razorpay.orders.create({
      amount: normalizedAmount,
      currency: currency.toUpperCase(),
      receipt: `inv_${invoiceNumber}`.slice(0, 40),
      notes: {
        invoiceId: String(invoiceId),
        invoiceNumber,
        ...notes,
      },
    });
    return {
      provider: 'razorpay',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      isSimulated: false,
    };
  }

  const simulatedOrderId = `order_${crypto.randomBytes(12).toString('hex')}`;
  return {
    provider: 'razorpay',
    orderId: simulatedOrderId,
    amount: normalizedAmount,
    currency: currency.toUpperCase(),
    keyId: 'rzp_test_simulated_creatoros',
    isSimulated: true,
  };
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!hasRazorpay) {
    return true;
  }
  const text = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');
  return expectedSignature === signature;
}

export function constructStripeEvent(rawBody, signature, endpointSecret) {
  if (!hasStripe || !stripe) {
    return JSON.parse(rawBody.toString());
  }
  return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
}
