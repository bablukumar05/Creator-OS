import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contractApi } from '../services/api';
import { money, date } from '../utils/format';
import { Button, Logo } from '../components/ui';

export default function PublicContractSign() {
  const { token } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signedByName, setSignedByName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [certData, setCertData] = useState(null);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    fetchContract();
  }, [token]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractApi.getPublic(token);
      setContract(data);
      if (data.isFullyExecuted || data.brandSignature?.signatureDataUrl) {
        setSignedSuccess(true);
        setCertData({
          documentHash: data.documentHash || data.brandSignature?.documentHash,
          executedAt: data.executedAt || data.brandSignature?.signedAt,
          creatorSignature: data.creatorSignature,
          brandSignature: data.brandSignature,
        });
      }
      if (data.brand?.contactPerson && !signedByName) {
        setSignedByName(data.brand.contactPerson);
      }
      if (data.brand?.contactEmail && !signerEmail) {
        setSignerEmail(data.brand.contactEmail);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Agreement signing link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing.current = true;
    hasDrawn.current = true;
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1b382b';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  };

  const handleSignSubmit = async (e) => {
    e.preventDefault();
    if (!signedByName.trim()) {
      toast.error('Please enter your full legal name.');
      return;
    }
    if (!hasDrawn.current || !canvasRef.current) {
      toast.error('Please sign on the signature pad above.');
      return;
    }
    if (!agreed) {
      toast.error('You must consent to legally binding electronic execution.');
      return;
    }

    try {
      setSigning(true);
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const updated = await contractApi.signPublic(token, {
        signedByName,
        signerEmail,
        signatureDataUrl,
      });

      setContract(updated);
      setSignedSuccess(true);
      setCertData({
        documentHash: updated.documentHash || updated.brandSignature?.documentHash,
        executedAt: updated.executedAt || updated.brandSignature?.signedAt,
        creatorSignature: updated.creatorSignature,
        brandSignature: updated.brandSignature,
      });
      toast.success('Contract legally executed and verified!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbf7] flex flex-col items-center justify-center p-6 text-[#242b27]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#2b5341] border-t-transparent" />
        <p className="mt-4 text-xs font-medium text-[#6e7768]">Loading secure legal agreement...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-[#fafbf7] flex flex-col items-center justify-center p-6 text-center text-[#242b27]">
        <Logo />
        <h2 className="text-2xl font-semibold mt-6 tracking-tight">Agreement Link Unavailable</h2>
        <p className="text-xs text-muted max-w-sm mt-2">{error || 'This contract does not exist or has expired.'}</p>
        <Link to="/" className="btn btn-secondary mt-6 text-xs">
          Return to Home
        </Link>
      </div>
    );
  }

  const isExecuted = contract.isFullyExecuted || signedSuccess;

  return (
    <div className="min-h-screen bg-[#fafbf7] text-[#242b27] pb-24 lg:pb-12">
      <header className="border-b border-[#e2e7d9] bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Logo />
          </Link>
          <span className="hidden sm:inline-block h-4 w-px bg-line" />
          <span className="hidden sm:inline-block text-[11px] font-medium text-muted">
            {contract.organizationId?.name || 'Creator Collaboration'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
            <ShieldCheck size={12} className="text-emerald-600" /> 256-Bit Cryptographic Audit
          </span>
          {isExecuted && (
            <Button variant="secondary" className="text-xs py-1 px-2.5" onClick={() => window.print()}>
              <Printer size={13} /> <span className="hidden sm:inline">Print / PDF</span>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
        {isExecuted && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#edf5e8] border border-[#bcd6ad] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-emerald-900">
                  Contract Fully Executed & Sealed!
                </h3>
                <p className="text-xs text-emerald-800">
                  Cryptographic Hash: <span className="font-mono">{certData?.documentHash?.slice(0, 20)}...</span>
                </p>
              </div>
            </div>
            <div className="text-xs text-emerald-900 font-medium">
              Executed: {date(certData?.executedAt || new Date())}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#e2e7d9] bg-white p-5 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eef2e7] pb-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6e7768]">
                {contract.contractType || 'COLLABORATION AGREEMENT'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#242b27] mt-0.5">
                {contract.title}
              </h1>
              <p className="text-xs text-muted mt-1 font-mono">
                Agreement #{contract.contractNumber}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  isExecuted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isExecuted ? 'FULLY EXECUTED' : 'AWAITING COUNTER-SIGNATURE'}
              </span>
              <p className="text-[11px] text-muted mt-2 flex items-center justify-end gap-1">
                <Calendar size={12} /> Date: {date(contract.createdAt || new Date())}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-[#eef2e7] text-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted">Brand / Sponsor Partner</p>
              <p className="font-semibold text-sm text-[#242b27] mt-1">
                {contract.brand?.title || contract.brand?.name || 'Sponsor Partner'}
              </p>
              {contract.brand?.contactPerson && (
                <p className="text-muted mt-0.5">Contact: {contract.brand.contactPerson}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted">Creator Organization</p>
              <p className="font-semibold text-sm text-[#242b27] mt-1 flex items-center gap-1.5">
                <Building2 size={13} className="text-[#2b5341]" />
                {contract.organizationId?.name || 'Creator Workspace'}
              </p>
              <p className="text-muted mt-0.5">Commercial Sponsorship Entity</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-line flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted">Total Compensation</p>
              <p className="text-lg font-bold text-[#2b5341] mt-0.5">{money(contract.amount || 0)}</p>
            </div>
            {contract.expirationDate && (
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted">Campaign Expiration</p>
                <p className="font-medium text-ink mt-0.5">{date(contract.expirationDate)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted">Currency & Settlement</p>
              <p className="font-medium text-ink mt-0.5">{contract.currency || 'INR'} Verified</p>
            </div>
          </div>

          {contract.deliverables && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                1. Scope of Work & Deliverables
              </h3>
              <div className="p-3.5 rounded-xl bg-[#fafbf7] border border-[#eef2e7] text-xs leading-relaxed text-[#242b27] whitespace-pre-line">
                {contract.deliverables}
              </div>
            </div>
          )}

          {contract.terms && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                2. Legal Terms & Commercial Covenants
              </h3>
              <div className="p-3.5 rounded-xl bg-[#fafbf7] border border-[#eef2e7] text-xs leading-relaxed text-[#55604e] whitespace-pre-line font-serif">
                {contract.terms}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#eef2e7] space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              3. Execution & Digital Signatures
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-line bg-canvas space-y-3">
                <span className="text-[10px] uppercase font-semibold text-muted">Creator Signature</span>
                {contract.creatorSignature?.signatureDataUrl ? (
                  <div className="space-y-2">
                    <div className="h-20 bg-white rounded-lg border border-line p-2 flex items-center justify-center">
                      <img
                        src={contract.creatorSignature.signatureDataUrl}
                        alt="Creator Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs font-semibold text-ink">{contract.creatorSignature.signedByName}</p>
                    <p className="text-[10px] text-muted flex items-center gap-1">
                      <Clock size={11} /> Signed {date(contract.creatorSignature.signedAt)}
                    </p>
                  </div>
                ) : (
                  <div className="h-24 bg-white/60 rounded-lg border border-dashed border-line flex items-center justify-center text-xs text-muted">
                    Signed by Creator Representative
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-line bg-canvas space-y-3">
                <span className="text-[10px] uppercase font-semibold text-muted">Brand Signature</span>
                {contract.brandSignature?.signatureDataUrl ? (
                  <div className="space-y-2">
                    <div className="h-20 bg-white rounded-lg border border-line p-2 flex items-center justify-center">
                      <img
                        src={contract.brandSignature.signatureDataUrl}
                        alt="Brand Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs font-semibold text-ink">{contract.brandSignature.signedByName}</p>
                    <p className="text-[10px] text-muted flex items-center gap-1">
                      <Clock size={11} /> Counter-signed {date(contract.brandSignature.signedAt)}
                    </p>
                  </div>
                ) : (
                  <div className="h-24 bg-white/60 rounded-lg border border-dashed border-amber-300 flex items-center justify-center text-xs text-amber-800 font-medium">
                    Awaiting Brand Signature Below
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isExecuted && (
            <div className="pt-6 border-t border-[#eef2e7] space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-ink">Sign Agreement as Brand Partner</h3>
              </div>

              <form onSubmit={handleSignSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="label">Full Legal Name *</label>
                    <input
                      className="input"
                      placeholder="e.g. Rahul Sharma"
                      value={signedByName}
                      onChange={(e) => setSignedByName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Corporate Email Address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="e.g. partnerships@brand.com"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">Draw Digital Signature *</label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs text-muted hover:text-ink flex items-center gap-1"
                    >
                      <RotateCcw size={12} /> Clear Signature
                    </button>
                  </div>

                  <div className="border border-line rounded-xl bg-white overflow-hidden shadow-xs cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      width={650}
                      height={160}
                      className="w-full h-40 touch-none bg-[#fdfdfb]"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <p className="text-[10px] text-muted">
                    Use your mouse, trackpad, or touch screen to draw your signature in the box above.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-canvas border border-line flex items-start gap-2.5 text-xs">
                  <input
                    type="checkbox"
                    id="consent-check"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-line"
                    required
                  />
                  <label htmlFor="consent-check" className="text-muted cursor-pointer leading-relaxed text-[11px]">
                    I confirm that I am authorized to bind the sponsoring company. I agree that this electronic signature carries full legal validity under applicable E-SIGN and digital signature regulations.
                  </label>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full py-3 justify-center text-sm font-semibold shadow-md"
                  loading={signing}
                >
                  <Lock size={14} /> Accept & Legally Counter-Sign Contract
                  <ArrowRight size={14} />
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
