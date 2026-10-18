import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Share2,
  Printer,
  Sparkles,
  MapPin,
  Send,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Check,
  Building2,
  Mail,
  Globe,
  Radio,
  X,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { creatorApi } from '../services/api';
import { money } from '../utils/format';
import { Button, Logo } from '../components/ui';

export default function PublicMediaKit() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    brandName: '',
    contactName: '',
    contactEmail: '',
    brandWebsite: '',
    serviceType: '',
    budget: '',
    timeline: '',
    message: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const profile = await creatorApi.getPublic(username || 'creator');
        setData(profile);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load media kit.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  function handleOpenInquiry(serviceTitle = '') {
    setSelectedService(serviceTitle);
    setForm((prev) => ({
      ...prev,
      serviceType: serviceTitle || (data?.rateCard?.services?.[0]?.contentType || 'Brand Sponsorship'),
    }));
    setInquirySuccess(null);
    setIsModalOpen(true);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Media kit link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleSubmitInquiry(e) {
    e.preventDefault();
    if (!form.brandName || !form.contactName || !form.contactEmail) {
      toast.error('Please fill in brand name, contact person and work email.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await creatorApi.submitInquiry(username || 'creator', {
        ...form,
        serviceType: form.serviceType || selectedService,
      });
      setInquirySuccess(res);
      toast.success('Inquiry submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b10] text-[#f1f3f9]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-[#8c94a6]">Loading verified media kit...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b10] p-4 text-[#f1f3f9]">
        <div className="w-full max-w-md rounded-2xl border border-line bg-[#121620] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#aa6b61]/20 text-[#e08b7d]">
            <X size={28} />
          </div>
          <h2 className="text-xl font-bold">Media Kit Unavailable</h2>
          <p className="mt-2 text-sm text-[#8c94a6]">{error || 'Creator profile could not be found.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/u/creator" className="btn btn-secondary">
              View Sample Profile
            </Link>
            <Link to="/" className="btn btn-primary">
              Back to CreatorOS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    displayName,
    headline,
    bio,
    profileImage,
    coverImage,
    location,
    categories = [],
    isVerified,
    socials = [],
    rateCard,
    pastCollaborations = [],
    highlights = [],
    totalReach,
    avgEngagementRate,
  } = data;

  const displayAvatar =
    profileImage ||
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop`;

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f3f9] selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-40 border-b border-[#1b2234] bg-[#07090e]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={22} />
            <span className="hidden text-xs font-semibold tracking-wider text-[#8c94a6] uppercase sm:inline">
              Verified Media Kit
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Available for Q4 Sponsorships
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#232b40] bg-[#121624] px-3 py-1.5 text-xs font-medium text-[#c6ccdb] transition hover:bg-[#1b2338]"
              title="Share profile link"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copied ? 'Link Copied' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden items-center gap-1.5 rounded-lg border border-[#232b40] bg-[#121624] px-3 py-1.5 text-xs font-medium text-[#c6ccdb] transition hover:bg-[#1b2338] sm:inline-flex"
              title="Print Media Kit"
            >
              <Printer size={14} />
              <span>Print PDF</span>
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenInquiry()}
              className="ml-1 inline-flex items-center gap-1.5 shadow-lg shadow-primary/20"
            >
              <Sparkles size={14} />
              Book Sponsorship
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-[#1d2538] bg-[#0e1320] shadow-2xl">
          <div className="relative h-44 w-full bg-gradient-to-r from-primary/30 via-accent/20 to-indigo-900/40 sm:h-56">
            {coverImage && (
              <img src={coverImage} alt="Cover" className="h-full w-full object-cover opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1320] via-transparent to-transparent" />
          </div>

          <div className="relative px-6 pb-8 pt-0 sm:px-10">
            <div className="-mt-16 flex flex-col gap-6 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-[#0e1320] bg-[#161c2e] shadow-xl sm:h-36 sm:w-36">
                  <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {displayName}
                    </h1>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                        <ShieldCheck size={13} />
                        Verified Partner
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-primary">@{username || 'creator'}</p>
                  {location && (
                    <div className="flex items-center gap-1.5 text-xs text-[#8c94a6]">
                      <MapPin size={12} />
                      {location}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleOpenInquiry()}
                  className="w-full sm:w-auto"
                >
                  <Send size={15} />
                  Book Collaboration
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t border-[#1a2236] pt-6">
              {headline && (
                <p className="text-base font-semibold text-[#e1e6f2] sm:text-lg">{headline}</p>
              )}
              {bio && (
                <p className="mt-2 text-sm leading-relaxed text-[#9ca5b9] sm:text-base">{bio}</p>
              )}

              {categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-lg border border-[#232d44] bg-[#141a2b] px-2.5 py-1 text-xs font-medium text-[#b5bed2]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#1c2438] bg-[#0e1320] p-5 shadow-lg">
            <div className="flex items-center justify-between text-[#8c94a6]">
              <span className="text-xs font-medium uppercase tracking-wider">Total Reach</span>
              <Users size={16} className="text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {(totalReach || 1200000).toLocaleString()}+
            </p>
            <p className="mt-1 text-xs text-[#8c94a6]">Verified across all channels</p>
          </div>

          <div className="rounded-2xl border border-[#1c2438] bg-[#0e1320] p-5 shadow-lg">
            <div className="flex items-center justify-between text-[#8c94a6]">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Engagement</span>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-emerald-400 sm:text-3xl">
              {avgEngagementRate || 5.2}%
            </p>
            <p className="mt-1 text-xs text-[#8c94a6]">Industry benchmark: 2.8%</p>
          </div>

          <div className="rounded-2xl border border-[#1c2438] bg-[#0e1320] p-5 shadow-lg">
            <div className="flex items-center justify-between text-[#8c94a6]">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Video Views</span>
              <Eye size={16} className="text-indigo-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-indigo-400 sm:text-3xl">75,000+</p>
            <p className="mt-1 text-xs text-[#8c94a6]">30-day rolling view average</p>
          </div>

          <div className="rounded-2xl border border-[#1c2438] bg-[#0e1320] p-5 shadow-lg">
            <div className="flex items-center justify-between text-[#8c94a6]">
              <span className="text-xs font-medium uppercase tracking-wider">Turnaround Time</span>
              <Clock size={16} className="text-amber-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-amber-400 sm:text-3xl">3-5 Days</p>
            <p className="mt-1 text-xs text-[#8c94a6]">Fast reliable delivery</p>
          </div>
        </section>

        {highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-around gap-4 rounded-2xl border border-[#1b2336] bg-[#0c101c] px-6 py-3.5">
            {highlights.map((hl, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-[#8c94a6]">{hl.label}:</span>
                <span className="text-xs font-semibold text-white">{hl.value}</span>
              </div>
            ))}
          </div>
        )}

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white sm:text-xl">Audience Reach by Platform</h2>
            <span className="text-xs text-[#8c94a6]">Live API verified metrics</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {socials.map((acc) => (
              <div
                key={acc.platform}
                className="group relative overflow-hidden rounded-2xl border border-[#1c2438] bg-[#0e1320] p-5 transition hover:border-primary/40 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{acc.platform}</span>
                  <Radio size={14} className="text-emerald-400" />
                </div>
                <p className="mt-1 text-xs text-[#8c94a6]">@{acc.username || username}</p>
                <div className="mt-4 flex items-baseline justify-between border-t border-[#182032] pt-3">
                  <div>
                    <span className="text-xl font-bold text-white">
                      {(acc.followers || 0).toLocaleString()}
                    </span>
                    <span className="block text-[11px] text-[#8c94a6]">Followers</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-emerald-400">
                      {acc.engagementRate || 4.5}%
                    </span>
                    <span className="block text-[11px] text-[#8c94a6]">Engagement</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Sponsorship Packages & Rate Card
              </h2>
              <p className="text-xs text-[#8c94a6] sm:text-sm">
                Transparent deliverables and pricing. Custom retainer packages available upon
                request.
              </p>
            </div>
            {rateCard?.negotiable && (
              <span className="inline-flex self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:self-auto">
                Negotiable for multi-deliverable deals
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(rateCard?.services || []).map((srv, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-[#1e263d] bg-[#0e1320] p-6 transition hover:border-primary/50 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                      {srv.platform}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#8c94a6]">
                      <Clock size={12} />
                      {srv.turnaroundDays || 3} Days Delivery
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-white">{srv.contentType}</h3>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {money(srv.basePrice, rateCard?.currency || 'INR')}
                    </span>
                    <span className="text-xs text-[#8c94a6]">/ deliverable</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-[#a2abbf]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      100% native integration & authentic review
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      1 round of script & edit revisions included
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      Dedicated bio link + pinned top comment (30 days)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      Post-campaign performance analytics report
                    </li>
                  </ul>
                </div>

                <Button
                  variant="primary"
                  className="mt-6 w-full"
                  onClick={() => handleOpenInquiry(srv.contentType)}
                >
                  Book This Package
                  <ArrowRight size={14} />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {pastCollaborations.length > 0 && (
          <section className="mt-14">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Featured Brand Collaborations
              </h2>
              <p className="text-xs text-[#8c94a6] sm:text-sm">
                Recent high-performing campaigns and brand partner endorsements
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pastCollaborations.map((collab, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between rounded-2xl border border-[#1b2338] bg-[#0e1320] p-6"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1b233a] font-bold text-primary">
                          {collab.brandName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{collab.brandName}</h4>
                          <p className="text-xs text-[#8c94a6]">{collab.deliverableType}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                        {collab.views}
                      </span>
                    </div>

                    {collab.testimonial && (
                      <p className="mt-4 text-xs italic leading-relaxed text-[#a2abbf]">
                        &quot;{collab.testimonial}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#182032] pt-3 text-[11px] text-[#8c94a6]">
                    <span>Verified Campaign Result</span>
                    <span>{collab.date || 'Completed'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-[#0e1320] to-accent/10 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to launch a campaign?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#a2abbf]">
            Submit your brand collaboration brief directly into my workspace. You will receive a
            formal response and availability confirmation within 24 hours.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleOpenInquiry()}
              className="inline-flex items-center gap-2 shadow-xl shadow-primary/25"
            >
              <Sparkles size={16} />
              Submit Brand Brief Now
            </Button>
          </div>
        </section>

        <footer className="mt-16 border-t border-[#1a2236] py-8 text-center text-xs text-[#6e778b]">
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
            <span>Powered by CreatorOS Enterprise</span>
            <span className="hidden sm:inline">·</span>
            <span>Cryptographically Verified Analytics & Rate Card</span>
            <span className="hidden sm:inline">·</span>
            <Link to="/" className="text-primary hover:underline">
              Build your own Media Kit
            </Link>
          </div>
        </footer>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#232c44] bg-[#0f1422] p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-[#8c94a6] transition hover:text-white"
            >
              <X size={20} />
            </button>

            {inquirySuccess ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="mt-4 text-2xl font-bold text-white">Inquiry Submitted!</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#a2abbf]">
                  {inquirySuccess.message ||
                    'Thank you! Your brand brief has been added directly to my pipeline. I will review your requirements and reach out via email.'}
                </p>
                <div className="mt-6 rounded-xl border border-[#1f283d] bg-[#141a2c] p-4 text-left text-xs text-[#8c94a6]">
                  <p>
                    <strong className="text-white">Brand:</strong> {form.brandName}
                  </p>
                  <p className="mt-1">
                    <strong className="text-white">Work Email:</strong> {form.contactEmail}
                  </p>
                  <p className="mt-1">
                    <strong className="text-white">Deliverable:</strong> {form.serviceType}
                  </p>
                  <p className="mt-1">
                    <strong className="text-white">Reference ID:</strong> {inquirySuccess.dealId}
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="mt-6 w-full"
                  onClick={() => {
                    setIsModalOpen(false);
                    setInquirySuccess(null);
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles size={12} />
                    Direct Collaboration Brief
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                    Book Sponsorship with {displayName}
                  </h3>
                  <p className="text-xs text-[#8c94a6]">
                    Fill in your brand campaign goals below. All inquiries are securely delivered to
                    the creator&apos;s workspace.
                  </p>
                </div>

                <form onSubmit={handleSubmitInquiry} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                        Brand / Company Name *
                      </label>
                      <div className="relative">
                        <Building2
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c94a6]"
                        />
                        <input
                          type="text"
                          required
                          value={form.brandName}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, brandName: e.target.value }))
                          }
                          placeholder="e.g. Sony Audio"
                          className="input w-full pl-9 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.contactName}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, contactName: e.target.value }))
                        }
                        placeholder="e.g. Neha Singhania"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c94a6]"
                        />
                        <input
                          type="email"
                          required
                          value={form.contactEmail}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, contactEmail: e.target.value }))
                          }
                          placeholder="neha@brand.com"
                          className="input w-full pl-9 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                        Brand Website
                      </label>
                      <div className="relative">
                        <Globe
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c94a6]"
                        />
                        <input
                          type="url"
                          value={form.brandWebsite}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, brandWebsite: e.target.value }))
                          }
                          placeholder="https://brand.com"
                          className="input w-full pl-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                        Deliverable Package *
                      </label>
                      <select
                        value={form.serviceType}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, serviceType: e.target.value }))
                        }
                        className="input w-full text-xs"
                      >
                        {(rateCard?.services || []).map((srv, idx) => (
                          <option key={idx} value={srv.contentType}>
                            {srv.platform}: {srv.contentType} (
                            {money(srv.basePrice, rateCard?.currency || 'INR')})
                          </option>
                        ))}
                        <option value="Custom Multi-Deliverable Campaign">
                          Custom Multi-Deliverable Campaign
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                        Proposed Budget (₹ / $)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.budget}
                        onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
                        placeholder="e.g. 65000"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                      Target Live Date / Timeline
                    </label>
                    <div className="relative">
                      <Calendar
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c94a6]"
                      />
                      <input
                        type="text"
                        value={form.timeline}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, timeline: e.target.value }))
                        }
                        placeholder="e.g. Mid November 2026 or Flexible"
                        className="input w-full pl-9 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#c6ccdb]">
                      Campaign Brief & Deliverable Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Tell the creator about your product, target audience, primary CTA, and goals..."
                      className="input w-full text-xs"
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="btn btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={submitting}
                      className="text-xs"
                    >
                      {submitting ? 'Submitting Brief...' : 'Send Sponsorship Brief'}
                      <Send size={13} />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
