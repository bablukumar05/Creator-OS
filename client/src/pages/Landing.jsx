import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
  Bot,
  ShieldCheck,
  Video,
  Globe,
  UploadCloud,
  FileText,
  Play,
  Server,
} from 'lucide-react';
import { Logo } from '../components/ui';

const corePillars = [
  {
    icon: Globe,
    title: 'Dynamic Public Media Kit & Link-in-Bio',
    badge: 'Stan Store + Bento',
    description:
      'Share your live verified audience stats, custom rate card, and past brand collaborations with one link. Brands submit briefs directly into your CRM.',
    link: '/u/creator',
    linkText: 'View Live Media Kit',
  },
  {
    icon: Video,
    title: 'Frame-Accurate Video Review Studio',
    badge: 'Frame.io Architecture',
    description:
      'Scrub videos frame-by-frame, draw annotations and arrows directly on the screen, and jump to exact timestamps for precision feedback.',
    link: '/review-studio',
    linkText: 'Review Studio Tour',
  },
  {
    icon: Bot,
    title: 'CreatorOS Neural Engine & Legal Contract Analyzer',
    badge: 'Neural Engine 2.0',
    description:
      'Generate viral hooks and multi-scene video scripts in seconds. Scan brand contracts to detect hidden legal risks and unfair terms.',
    link: '/ai-studio',
    linkText: 'Explore Neural Engine',
  },
  {
    icon: ShieldCheck,
    title: 'Fintech Escrow Vault & Payments',
    badge: 'Stripe & Razorpay',
    description:
      'Never chase an invoice again. Brands deposit funds in secure escrow before production starts, releasing automatically upon delivery.',
    link: '/escrow',
    linkText: 'View Escrow Vault',
  },
  {
    icon: FileText,
    title: 'Legally Binding E-Signatures',
    badge: 'DocuSign Engine',
    description:
      'Sign brand contracts in-app with touch & mouse canvas signature pads, cryptographic SHA-256 sealing, and public unauthenticated brand portals.',
    link: '/contracts',
    linkText: 'Inspect Legal Suite',
  },
  {
    icon: UploadCloud,
    title: 'Cloudflare R2 & S3 Direct 4K Streaming',
    badge: 'Redis 7.x Queue',
    description:
      'Upload heavy 4K ProRes videos and raw LUT packages up to 5GB with real-time speed progress, zero server memory bottlenecks, and BullMQ worker queues.',
    link: '/media',
    linkText: 'Check Cloud Engine',
  },
];

export default function Landing() {
  const [activeTab, setActiveTab] = useState('mediakit');

  return (
    <div className="marketing min-h-screen bg-[#fafbf7] text-[#242b27] selection:bg-[#2b5341] selection:text-white">
      <header className="sticky top-0 z-40 border-b border-[#e6eadf]/80 bg-[#fafbf7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-medium text-[#687063] md:flex">
            <a href="#features" className="transition-colors hover:text-[#2b5341]">
              Platform Suite
            </a>
            <a href="#preview" className="transition-colors hover:text-[#2b5341]">
              Live Studio Tour
            </a>
            <Link to="/u/creator" className="transition-colors hover:text-[#2b5341]">
              Public Media Kit
            </Link>
            <a href="#architecture" className="transition-colors hover:text-[#2b5341]">
              Cloud & DevOps
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#2b5341]">
              Self-Hosted
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/u/creator"
              className="hidden items-center gap-1.5 rounded-lg border border-[#d8e0ce] bg-white px-3 py-1.5 text-xs font-semibold text-[#3b5435] transition hover:bg-[#f0f4ea] sm:inline-flex"
            >
              <Globe size={13} />
              Sample Media Kit
            </Link>
            <Link to="/login" className="text-xs font-semibold text-[#44503f] hover:text-[#2b5341]">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary text-xs shadow-sm">
              Get Started
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate mx-auto max-w-7xl overflow-hidden px-6 pb-8 pt-10 text-center md:px-12 md:pt-14">
          <div className="mx-auto flex max-w-fit items-center gap-2 rounded-full border border-[#d9e2ce] bg-[#f0f5e8] px-4 py-1.5 text-xs font-semibold text-[#405c36] shadow-sm">
            <Sparkles size={14} className="text-[#557849]" />
            <span>ENTERPRISE CREATOR OS 2.0 · 6 UNICORN MODULES LIVE</span>
          </div>

          <h1 className="mx-auto mt-5 max-w-5xl text-[36px] font-semibold leading-[1.12] tracking-[-1.5px] sm:text-[50px] sm:tracking-[-2.5px] md:text-[64px] md:tracking-[-3.2px]">
            The complete operating system
            <br className="hidden sm:inline" />
            {' '}for modern <span className="font-serif italic text-[#4a6b3e]">creators & agencies.</span>
          </h1>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn btn-primary min-h-12 px-7 shadow-lg shadow-[#2b5341]/15">
              Launch Workspace Free
              <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="btn btn-secondary min-h-12 px-6">
              Sign In Demo
              <ArrowUpRight size={15} />
            </Link>
            <Link
              to="/u/creator"
              className="btn min-h-12 border border-[#3b5435]/30 bg-white px-6 text-[#2b5341] transition hover:bg-[#f2f6ee]"
            >
              <Globe size={16} />
              Explore Live Media Kit
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 border-y border-[#e2e7d9] py-5 sm:grid-cols-4 md:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#242b27] md:text-3xl">₹4.5M+</p>
              <p className="mt-1 text-xs text-[#788271]">Escrow Funds Secured</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#242b27] md:text-3xl">1.2M+</p>
              <p className="mt-1 text-xs text-[#788271]">Audience Reach Synced</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#242b27] md:text-3xl">1,200+</p>
              <p className="mt-1 text-xs text-[#788271]">E-Contracts Executed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#242b27] md:text-3xl">5 GB</p>
              <p className="mt-1 text-xs text-[#788271]">Direct R2 4K Streaming</p>
            </div>
          </div>

          <div id="preview" className="mt-14 text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
              {[
                ['mediakit', 'Public Media Kit & Rate Card', Globe],
                ['review', 'Frame.io Video Review', Video],
                ['ai', 'Neural Engine & Contract Scanner', Bot],
                ['escrow', 'Escrow Vault & Payments', ShieldCheck],
                ['cloud', 'Direct R2 / S3 4K Uploads', UploadCloud],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    activeTab === id
                      ? 'bg-[#2b5341] text-white shadow-md'
                      : 'border border-[#dce4d1] bg-white text-[#55614f] hover:bg-[#f0f4ea]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="relative mx-auto mt-4 max-w-5xl overflow-hidden rounded-3xl border border-[#dce3d2] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e9ede3] bg-[#f7f9f4] px-5 py-3 text-xs text-[#727d6d]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#e38883]" />
                  <span className="h-3 w-3 rounded-full bg-[#f4cb84]" />
                  <span className="h-3 w-3 rounded-full bg-[#a1d99b]" />
                  <span className="ml-2 font-mono text-[11px] text-[#55614e]">
                    creatoros.app/{activeTab === 'mediakit' ? 'u/creator' : activeTab}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-700">Verified Live Module</span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                {activeTab === 'mediakit' && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#edf1e7] pb-6">
                      <div className="flex items-center gap-4">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"
                          alt="Creator"
                          className="h-16 w-16 rounded-2xl object-cover shadow-md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-[#1f2621]">Aarav Sharma</h3>
                            <span className="rounded-full bg-[#e3eed9] px-2 py-0.5 text-[10px] font-bold text-[#35522e]">
                              Verified Creator
                            </span>
                          </div>
                          <p className="text-xs text-[#526a48]">@aarav · Mumbai, India · 1.2M Reach</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to="/u/creator" className="btn btn-primary text-xs">
                          Open Public Media Kit Page
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-[#e4ecdd] bg-[#f9faf7] p-4">
                        <span className="text-xs font-semibold text-[#546b46]">Dedicated 4K Video</span>
                        <p className="mt-2 text-2xl font-bold text-[#1f2621]">₹65,000</p>
                        <p className="mt-1 text-xs text-[#7a8573]">5 Days Delivery · 1 Revision</p>
                      </div>
                      <div className="rounded-xl border border-[#e4ecdd] bg-[#f9faf7] p-4">
                        <span className="text-xs font-semibold text-[#546b46]">Instagram Reel + 3x Stories</span>
                        <p className="mt-2 text-2xl font-bold text-[#1f2621]">₹35,000</p>
                        <p className="mt-1 text-xs text-[#7a8573]">3 Days Delivery · Pinned Link</p>
                      </div>
                      <div className="rounded-xl border border-[#e4ecdd] bg-[#f9faf7] p-4">
                        <span className="text-xs font-semibold text-[#546b46]">Full Campaign Launch Blast</span>
                        <p className="mt-2 text-2xl font-bold text-[#1f2621]">₹1,10,000</p>
                        <p className="mt-1 text-xs text-[#7a8573]">YT + IG + X + Bio Link</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#e0e7d8] bg-white p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#252f27]">Direct Inbound Brand Brief Form</span>
                        <span className="text-emerald-700 font-medium">Auto-Ingests into Deals CRM</span>
                      </div>
                      <p className="mt-1 text-xs text-[#7a8573]">
                        Brands submit budgets and requirements directly without signing up. Deals arrive instantly in the creator workspace.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'review' && (
                  <div className="space-y-5">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#090b10] p-4 text-white">
                      <div className="flex items-center justify-between text-xs text-[#8c94a6]">
                        <span>Review Studio · 4K Master Cut v2</span>
                        <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-primary">01:24 / 04:30</span>
                      </div>
                      <div className="flex h-3/4 items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <Play size={20} />
                          </div>
                          <span className="text-xs text-[#9ba4b7]">Interactive Video Scrubber & Canvas Overlay</span>
                        </div>
                      </div>
                      <div className="absolute inset-x-4 bottom-4">
                        <div className="relative h-2 w-full rounded-full bg-[#1b2336]">
                          <div className="h-full w-1/3 rounded-full bg-primary" />
                          <span className="absolute left-[33%] top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary" />
                          <span className="absolute left-[15%] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-400" />
                          <span className="absolute left-[65%] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#e1e7d8] bg-[#f9faf6] p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-[#202923]">Brand Director @ Sony</span>
                          <span className="font-mono text-primary">00:42</span>
                        </div>
                        <p className="mt-1 text-[#64705f]">&quot;Increase volume on product reveal sound effect here.&quot;</p>
                      </div>
                      <div className="rounded-xl border border-[#e1e7d8] bg-[#f9faf6] p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-[#202923]">Editor @ Studio</span>
                          <span className="font-mono text-emerald-700">01:24</span>
                        </div>
                        <p className="mt-1 text-[#64705f]">&quot;Added color grade LUT and corrected contrast level.&quot;</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#3b533b] bg-[#162118] p-5 text-white">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#a4bc8c]">
                        <Bot size={15} />
                        <span>CreatorOS Neural Engine · Intelligent Script & Legal Suite</span>
                      </div>
                      <h4 className="mt-2 text-base font-bold">Smart Video Script & Contract Risk Scanner</h4>
                      <p className="mt-1 text-xs text-[#a9b59f]">
                        Generates YouTube hooks, visual scene b-roll queues, and analyzes brand agreements for indemnification traps.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                      <div className="rounded-xl border border-[#e0e7d8] bg-[#f9faf6] p-4">
                        <span className="font-bold text-[#2a4d33] uppercase text-[10px]">Contract Risk Scanner</span>
                        <div className="mt-2 space-y-2 text-[#465442]">
                          <p className="font-semibold text-amber-800">⚠️ Risk Detected: Perpetual Exclusivity</p>
                          <p className="text-[11px] leading-relaxed">
                            Clause 8 binds you from working with any tech brand for 24 months. Engine recommendation: Limit to 30 days post-publish.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#e0e7d8] bg-[#f9faf6] p-4">
                        <span className="font-bold text-[#2a4d33] uppercase text-[10px]">Viral Hook Generator</span>
                        <div className="mt-2 space-y-2 text-[#465442]">
                          <p className="font-semibold text-[#1e251f]">Hook #1: Reverse Mystery</p>
                          <p className="text-[11px] leading-relaxed">
                            &quot;I tested 50 creator tools so you don&apos;t waste ₹10,000 on software you will never use...&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'escrow' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-[#e0e7d8] bg-[#f9faf6] p-4">
                        <span className="text-[10px] font-bold uppercase text-[#546b46]">Step 1: Escrow Deposit</span>
                        <p className="mt-2 font-bold text-base text-[#1e251f]">₹75,000 Locked</p>
                        <p className="mt-1 text-xs text-[#6e7a68]">Stripe / Razorpay Checkout</p>
                      </div>
                      <div className="rounded-xl border border-[#e0e7d8] bg-[#f9faf6] p-4">
                        <span className="text-[10px] font-bold uppercase text-[#546b46]">Step 2: Deliverable Review</span>
                        <p className="mt-2 font-bold text-base text-[#1e251f]">Milestone Approved</p>
                        <p className="mt-1 text-xs text-[#6e7a68]">Video review completed</p>
                      </div>
                      <div className="rounded-xl border border-[#e0e7d8] bg-[#f9faf6] p-4">
                        <span className="text-[10px] font-bold uppercase text-emerald-700">Step 3: Instant Release</span>
                        <p className="mt-2 font-bold text-base text-emerald-700">100% Payout Sent</p>
                        <p className="mt-1 text-xs text-[#6e7a68]">GST compliant tax invoice</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#dce4d1] bg-white p-4 text-xs text-[#52614b]">
                      <div className="flex items-center justify-between font-semibold text-[#202821]">
                        <span>Zero-Risk Creator Guarantee</span>
                        <span>Stripe Connect & Razorpay UPI</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed">
                        Funds are held in neutral escrow until both creator and brand milestones are confirmed. No payment chasing.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'cloud' && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-[#232d42] bg-[#0c101c] p-5 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                          <UploadCloud size={16} />
                          <span>Direct S3 & Cloudflare R2 Upload Engine</span>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          Redis 7.x Queue Healthy
                        </span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Studio_Master_ProRes_4K.mov (3.2 GB)</span>
                          <span className="font-mono text-primary font-bold">100% Uploaded</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[#1b2338]">
                          <div className="h-full w-full rounded-full bg-gradient-to-r from-primary to-accent" />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#8c94a6]">
                          <span>3.2 GB of 3.2 GB</span>
                          <span>Upload Speed: 28.4 MB/s · BullMQ Transcode Queued</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 md:px-12">
          <div className="mb-14 text-center">
            <span className="rounded-full border border-[#d6e0cc] bg-[#f0f5e8] px-3.5 py-1 text-xs font-semibold text-[#415a37]">
              COMPLETE UNICORN ARCHITECTURE
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#1f2621] md:text-5xl">
              6 Built-in Engines. Zero External Tools.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-[#6c7866]">
              Every tool modern content creators and talent agencies need to scale their business
              from zero to millions.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {corePillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#e1e7d8] bg-white p-7 shadow-sm transition hover:border-[#2b5341]/40 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4eb] text-[#2b5341] transition group-hover:bg-[#2b5341] group-hover:text-white">
                        <Icon size={24} />
                      </div>
                      <span className="rounded-lg bg-[#edf3e8] px-2.5 py-1 text-[10px] font-bold text-[#445f3a]">
                        {p.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#202922]">{p.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#727e6c]">{p.description}</p>
                  </div>

                  <Link
                    to={p.link}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b5341] transition group-hover:translate-x-1"
                  >
                    <span>{p.linkText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="architecture"
          className="mx-6 max-w-7xl rounded-3xl bg-[#1d2720] px-6 py-16 text-white md:mx-auto md:px-14"
        >
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#2f4233] px-3.5 py-1.5 text-xs font-medium text-[#c0d6ad]">
                <Server size={14} /> DEVOPS & ENTERPRISE SCALE
              </span>
              <h2 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
                Built for High Scale.
                <br />
                Docker, Redis & S3 Ready.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#a8b79b]">
                Deploy CreatorOS anywhere. Multi-stage Docker containers, Redis 7 task queues for background jobs, and direct S3/R2 presigned streaming make it blazingly fast under heavy load.
              </p>
              <ul className="mt-6 space-y-3 text-xs text-[#c8d8bd]">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#86a870]" />
                  Direct S3 & Cloudflare R2 Presigned URLs (zero server load on 4K uploads)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#86a870]" />
                  Redis 7.x BullMQ Worker Queues for background video transcoding & emails
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#86a870]" />
                  Multi-container Docker Compose microservices stack (Server, Client, Mongo, Redis)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#86a870]" />
                  Cryptographic SHA-256 E-Sign Document Audit Trail
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#334737] bg-[#141d16] p-6 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#293d2e] pb-3 text-[#799072]">
                <span>docker-compose.yml · Production Stack</span>
                <span className="text-emerald-400">4 Services Running</span>
              </div>
              <div className="mt-4 space-y-2 text-[#b2c8a4]">
                <p className="text-white font-bold">services:</p>
                <p className="pl-4">server: node:22-alpine [Port 5000]</p>
                <p className="pl-4">client: nginx:alpine [Port 80]</p>
                <p className="pl-4">redis: redis:7-alpine [Port 6379]</p>
                <p className="pl-4">mongo: mongo:7-jammy [Port 27017]</p>
                <p className="mt-3 text-[11px] text-[#718568]">
                  Status: All containers health-checked & ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-y border-[#e2e7d9] bg-[#f0f4ea] px-6 py-20">
          <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#47663d]">
                SELF-HOSTED FREEDOM
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1e251f] md:text-4xl">
                Deploy On Your Terms.
                <br />
                Zero Platform Fees.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#687562]">
                Run CreatorOS on your own cloud (AWS, Cloudflare, DigitalOcean, or Render). Keep
                100% of your sponsorship revenue and client fees.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d6e0ce] bg-white p-8 shadow-xl">
              <span className="rounded-full bg-[#ecf3e7] px-3 py-1 text-xs font-bold text-[#35522e]">
                CREATOROS ENTERPRISE
              </span>
              <h3 className="mt-4 text-3xl font-extrabold text-[#1f2721]">Complete Suite</h3>
              <p className="mt-1 text-xs text-[#7e8a78]">Self-hosted · Unlimited usage · Open source friendly</p>

              <ul className="my-6 space-y-3 text-xs text-[#43523f]">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#4e743e] shrink-0" />
                  Public Dynamic Media Kit & Rate Card (`/u/:username`)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#4e743e] shrink-0" />
                  Timecoded Video Review Studio with Canvas Drawing
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#4e743e] shrink-0" />
                  CreatorOS Neural Engine Script Generator & Contract Auditor
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#4e743e] shrink-0" />
                  Stripe & Razorpay Escrow Vault with PDF Invoicing
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#4e743e] shrink-0" />
                  In-App & Public Digital E-Signatures
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#4e743e] shrink-0" />
                  Direct S3/R2 Cloud Storage & Redis BullMQ Pipeline
                </li>
              </ul>

              <Link to="/register" className="btn btn-primary w-full justify-center">
                Launch Your Workspace Now
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-6 my-16 rounded-3xl bg-[#283e2e] px-6 py-16 text-center text-white md:mx-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Start Running Your Creator Business Like a Unicorn.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-[#b6c7ad]">
            Ditch spreadsheets, unpaid invoices, and fragmented tools. CreatorOS brings everything
            into one beautifully designed operating system.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn bg-white px-7 text-[#25392b] font-semibold hover:bg-[#f2f5ee]">
              Create Free Workspace
              <ArrowRight size={15} />
            </Link>
            <Link to="/u/creator" className="btn border border-white/30 text-white hover:bg-white/10">
              <Globe size={15} />
              View Public Media Kit
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e0e7d7] bg-[#f3f7ee] text-[#242b27]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-12 md:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <Logo />
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#596654]">
                The unified commercial operating system for high-performing creators, talent managers, and media agencies. Streamline deals, escrow, video reviews, and AI ideation in one place.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#d2dec8] bg-white/80 px-3 py-1 text-xs font-medium text-[#3b5534] shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>All Systems Operational</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d2dec8] bg-white/80 px-3 py-1 text-xs font-medium text-[#465a40] shadow-xs">
                  <ShieldCheck size={13} className="text-emerald-700" />
                  <span>SHA-256 E-Sign Verified</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#35522e]">Modules</p>
              <ul className="mt-4 space-y-2.5 text-xs text-[#52604d]">
                <li>
                  <Link to="/u/creator" className="transition hover:text-[#254228]">
                    Dynamic Media Kits
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition hover:text-[#254228]">
                    Video Review Studio
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition hover:text-[#254228]">
                    CreatorOS Neural Engine
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition hover:text-[#254228]">
                    Escrow Vault & Payouts
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition hover:text-[#254228]">
                    Digital Contracts & E-Sign
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition hover:text-[#254228]">
                    Multi-Platform Calendar
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#35522e]">Solutions</p>
              <ul className="mt-4 space-y-2.5 text-xs text-[#52604d]">
                <li>
                  <Link to="/register" className="transition hover:text-[#254228]">
                    For Solo Creators
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="transition hover:text-[#254228]">
                    For Talent Agencies
                  </Link>
                </li>
                <li>
                  <Link to="/u/creator" className="transition hover:text-[#254228]">
                    Public Rate Cards
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="transition hover:text-[#254228]">
                    Self-Hosted Deployment
                  </a>
                </li>
                <li>
                  <Link to="/login" className="transition hover:text-[#254228]">
                    Brand Collaboration Hub
                  </Link>
                </li>
                <li>
                  <a href="/api/health" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-[#254228]">
                    System Health
                    <ArrowUpRight size={12} />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#35522e]">Platform</p>
              <ul className="mt-4 space-y-2.5 text-xs text-[#52604d]">
                <li>
                  <Link to="/login" className="transition hover:text-[#254228]">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="transition hover:text-[#254228]">
                    Create Free Workspace
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="transition hover:text-[#254228]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="transition hover:text-[#254228]">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="transition hover:text-[#254228]">
                    Security Architecture
                  </Link>
                </li>
                <li>
                  <a href="#pillars" className="transition hover:text-[#254228]">
                    Platform Tour
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#dce5d3] pt-6 text-[11px] text-[#6e7b68] sm:flex-row">
            <p>© {new Date().getFullYear()} CreatorOS Enterprise. Built for creators and agencies.</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[#50644b]">
                <Globe size={12} />
                <span>INR (₹) & Global Escrow Enabled</span>
              </span>
              <span className="text-[#a5b29f]">·</span>
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="transition hover:text-[#254228]"
              >
                Back to top ↑
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}