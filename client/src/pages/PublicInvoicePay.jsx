import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, downloadInvoice } from '../services/api';
import { money, date } from '../utils/format';
import { Button, Logo } from '../components/ui';

export default function PublicInvoicePay() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [provider, setProvider] = useState('razorpay');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paidTx, setPaidTx] = useState(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/payments/public/invoice/${id}`);
      setInvoice(res.data.data);
      if (res.data.data.status === 'Paid' || res.data.data.remainingAmount === 0) {
        setPaymentSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice not found or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!invoice || invoice.remainingAmount <= 0) return;
    setPaying(true);

    try {
      const checkoutRes = await api.post(`/payments/public/checkout/${id}`, {
        provider,
        currency: invoice.gatewayConfig?.currency || 'INR',
      });

      const data = checkoutRes.data.data;

      if (provider === 'stripe') {
        if (!data.isSimulated && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        const verifyRes = await api.post('/payments/public/verify', {
          invoiceId: invoice._id,
          provider: 'stripe',
          amount: invoice.remainingAmount,
          paymentMethod: 'Stripe International Card',
        });

        setPaymentSuccess(true);
        setPaidTx(verifyRes.data.data.payment);
        setInvoice((prev) => ({
          ...prev,
          status: 'Paid',
          paidAmount: prev.amount,
          remainingAmount: 0,
        }));
        toast.success('Payment verified successfully via Stripe!');
      } else {
        if (!data.isSimulated && window.Razorpay) {
          const rzp = new window.Razorpay({
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: invoice.organization?.name || 'CreatorOS Invoice',
            description: `Invoice #${invoice.number}`,
            order_id: data.orderId,
            handler: async (response) => {
              const verifyRes = await api.post('/payments/public/verify', {
                invoiceId: invoice._id,
                provider: 'razorpay',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: invoice.remainingAmount,
                paymentMethod: 'Razorpay UPI / Card',
              });
              setPaymentSuccess(true);
              setPaidTx(verifyRes.data.data.payment);
              setInvoice((prev) => ({
                ...prev,
                status: 'Paid',
                paidAmount: prev.amount,
                remainingAmount: 0,
              }));
              toast.success('Payment verified successfully via Razorpay!');
            },
            prefill: {
              email: invoice.clientEmail || '',
            },
            theme: { color: '#2b5341' },
          });
          rzp.open();
          return;
        }

        const verifyRes = await api.post('/payments/public/verify', {
          invoiceId: invoice._id,
          provider: 'razorpay',
          razorpay_order_id: data.orderId,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: 'simulated_signature',
          amount: invoice.remainingAmount,
          paymentMethod: 'Razorpay Instant UPI / Card',
        });

        setPaymentSuccess(true);
        setPaidTx(verifyRes.data.data.payment);
        setInvoice((prev) => ({
          ...prev,
          status: 'Paid',
          paidAmount: prev.amount,
          remainingAmount: 0,
        }));
        toast.success('Payment settled and recorded successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed. Try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbf7] flex flex-col items-center justify-center p-6 text-[#242b27]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#2b5341] border-t-transparent" />
        <p className="mt-4 text-xs font-medium text-[#6e7768]">Loading secure payment portal...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#fafbf7] flex flex-col items-center justify-center p-6 text-center text-[#242b27]">
        <Logo />
        <h2 className="text-2xl font-semibold mt-6 tracking-tight">Invoice Unavailable</h2>
        <p className="text-xs text-muted max-w-sm mt-2">{error || 'This invoice does not exist or has been archived.'}</p>
        <Link to="/" className="btn btn-secondary mt-6 text-xs">
          Return to Home
        </Link>
      </div>
    );
  }

  const isPaid = invoice.status === 'Paid' || invoice.remainingAmount <= 0;

  return (
    <div className="min-h-screen bg-[#fafbf7] text-[#242b27] pb-24 lg:pb-12">
      <header className="border-b border-[#e2e7d9] bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Logo />
          </Link>
          <span className="hidden sm:inline-block h-4 w-px bg-line" />
          <span className="hidden sm:inline-block text-[11px] font-medium text-muted">
            {invoice.organization?.name || 'Creator Workspace'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
            <ShieldCheck size={12} className="text-emerald-600" /> 256-Bit SSL Encrypted
          </span>
          <Button
            variant="secondary"
            className="text-xs py-1 px-2.5"
            onClick={() => downloadInvoice(invoice._id).catch((_e) => toast.error('Failed to download PDF.'))}
          >
            <Download size={13} /> <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
        {paymentSuccess && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#edf5e8] border border-[#bcd6ad] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-emerald-900">Payment Completed & Verified!</h3>
                <p className="text-xs text-emerald-800">
                  Transaction {paidTx?.transactionId || 'Settled'} · A receipt was generated and synced with CreatorOS.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="text-xs shrink-0 w-full sm:w-auto"
              onClick={() => downloadInvoice(invoice._id)}
            >
              <Download size={13} /> Download Receipt
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-[#e2e7d9] bg-white p-5 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eef2e7] pb-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6e7768]">INVOICE</span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#242b27] mt-0.5">
                  #{invoice.number}
                </h1>
                <p className="text-xs text-muted mt-1">{invoice.title}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : invoice.status === 'Partially Paid'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  {isPaid ? 'PAID IN FULL' : invoice.status.toUpperCase()}
                </span>
                <p className="text-[11px] text-muted mt-2 flex items-center justify-end gap-1">
                  <Calendar size={12} /> Due: {invoice.dueDate ? date(invoice.dueDate) : 'On Receipt'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-[#eef2e7] text-xs">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted">Billed To</p>
                <p className="font-semibold text-sm text-[#242b27] mt-1">
                  {invoice.brand?.title || invoice.brand?.name || 'Valued Client'}
                </p>
                {invoice.clientEmail && <p className="text-muted mt-0.5">{invoice.clientEmail}</p>}
                {invoice.clientAddress && <p className="text-muted mt-0.5 whitespace-pre-line">{invoice.clientAddress}</p>}
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted">Issued By</p>
                <p className="font-semibold text-sm text-[#242b27] mt-1 flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#2b5341]" />
                  {invoice.organization?.name || 'Creator Workspace'}
                </p>
                <p className="text-muted mt-0.5">{invoice.creator?.name || 'Creator'}</p>
              </div>
            </div>

            <div className="py-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Line Items & Deliverables</h3>
              <div className="space-y-2.5">
                {invoice.items?.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#fafbf7] border border-[#eef2e7] text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#242b27]">{item.description || item.title || 'Creative Service'}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        Qty: {item.quantity} × {money(item.rate)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm text-[#242b27]">{money(item.amount || item.quantity * item.rate)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#eef2e7] pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{money(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-{money(invoice.discount)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Tax ({invoice.tax}%)</span>
                  <span>+{money(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-[#eef2e7] pt-2 text-[#242b27]">
                <span>Total Amount</span>
                <span>{money(invoice.amount || invoice.totalAmount)}</span>
              </div>
              {invoice.paidAmount > 0 && (
                <div className="flex justify-between text-xs font-medium text-emerald-800">
                  <span>Amount Paid</span>
                  <span>-{money(invoice.paidAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#2b5341] border-t border-line pt-2">
                <span>Balance Due</span>
                <span>{money(invoice.remainingAmount)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-3.5 rounded-xl bg-[#f4f7f0] border border-[#e2e7d9] text-[11px] leading-relaxed text-[#55604e]">
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-[#e2e7d9] bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold tracking-tight text-[#242b27]">Instant Checkout</h3>
              </div>

              {isPaid ? (
                <div className="p-5 rounded-xl bg-[#edf5e8] border border-[#bcd6ad] text-center space-y-2">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                  <p className="font-semibold text-sm text-emerald-950">Invoice Fully Paid</p>
                  <p className="text-xs text-emerald-800">No balance remaining on this document.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setProvider('razorpay')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          provider === 'razorpay'
                            ? 'border-[#2b5341] bg-[#f0f5ec] text-[#2b5341] ring-1 ring-[#2b5341]'
                            : 'border-[#e2e7d9] bg-white hover:bg-canvas text-muted'
                        }`}
                      >
                        <QrCode size={18} className="mb-2" />
                        <div>
                          <p className="font-semibold text-xs text-ink">UPI / Indian Cards</p>
                          <p className="text-[10px] text-muted">Razorpay Gateway</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProvider('stripe')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          provider === 'stripe'
                            ? 'border-[#2b5341] bg-[#f0f5ec] text-[#2b5341] ring-1 ring-[#2b5341]'
                            : 'border-[#e2e7d9] bg-white hover:bg-canvas text-muted'
                        }`}
                      >
                        <CreditCard size={18} className="mb-2" />
                        <div>
                          <p className="font-semibold text-xs text-ink">Global Cards</p>
                          <p className="text-[10px] text-muted">Stripe Gateway</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#fafbf7] border border-[#e2e7d9] space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span>Paying Now:</span>
                      <span className="font-bold text-sm text-[#2b5341]">{money(invoice.remainingAmount)}</span>
                    </div>
                    <p className="text-[10px] text-muted flex items-center gap-1">
                      <Clock size={11} /> Immediate invoice status settlement
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full py-3 text-sm font-semibold justify-center shadow-md"
                    onClick={handlePayNow}
                    loading={paying}
                  >
                    Pay {money(invoice.remainingAmount)}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#e2e7d9] bg-white p-4 space-y-3 text-xs text-muted">
              <div className="flex items-center gap-2 font-medium text-[#242b27]">
                <ShieldCheck size={16} className="text-[#2b5341]" /> Guaranteed Payment Security
              </div>
              <p className="text-[11px] leading-relaxed">
                Payments are processed via authorized PCI-DSS Level 1 compliant gateway partners. Your payment details are encrypted in transit.
              </p>
              <div className="pt-2 border-t border-[#eef2e7] flex items-center justify-between text-[10px]">
                <span>CreatorOS Fintech Engine</span>
                <span className="font-semibold text-emerald-800">v2.0 Verified</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {!isPaid && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#e2e7d9] p-3 px-4 sm:hidden z-20 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-[10px] text-muted uppercase font-semibold">Total Due</p>
            <p className="text-base font-bold text-[#2b5341]">{money(invoice.remainingAmount)}</p>
          </div>
          <Button variant="primary" className="py-2.5 px-5 text-xs font-semibold" onClick={handlePayNow} loading={paying}>
            Pay Now <ExternalLink size={13} />
          </Button>
        </div>
      )}
    </div>
  );
}
