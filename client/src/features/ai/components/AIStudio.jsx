import { useState } from 'react';
import {
  Sparkles,
  Clapperboard,
  ShieldAlert,
  Handshake,
  Copy,
  Check,
  Send,
  ArrowRight,
  TrendingUp,
  FileCheck,
  FileText,
  AlertTriangle,
  Lightbulb,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { genaiApi } from '../../../services/api';
import { Button, Badge } from '../../../components/ui';

const SAMPLE_PREDATORY_CONTRACT = `INFLUENCER MARKETING AND BRAND AMBASSADOR AGREEMENT

1. SERVICES & DELIVERABLES:
Creator agrees to produce and publish one (1) dedicated video and two (2) social posts promoting the Sponsor's line of energy drinks.

2. INTELLECTUAL PROPERTY & OWNERSHIP:
Creator hereby assigns, transfers, and conveys to Sponsor all worldwide right, title, and interest in and to the Deliverables and creator likeness, in perpetuity, across all media now known or hereafter devised, as a work made for hire.

3. EXCLUSIVITY:
Creator agrees to perpetual category exclusivity and shall not mention, review, or collaborate with any competing beverage brand indefinitely without prior written consent of Sponsor.

4. APPROVALS & REVISIONS:
Creator agrees to make all edits, cuts, and re-shoots necessary until full satisfaction is confirmed by Sponsor at no additional compensation.

5. PAYMENT TERMS:
Sponsor shall disburse payment within ninety (90) to one hundred twenty (120) business days following final metric audit.

6. INDEMNIFICATION:
Creator shall defend, indemnify, and hold harmless Sponsor and its affiliates against any and all claims, liabilities, damages, and attorney fees without limitation.`;

export function AIStudio() {
  const [activeTab, setActiveTab] = useState('script');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [scriptForm, setScriptForm] = useState({
    topic: 'How I Built a Profitable SaaS Solo in 30 Days',
    platform: 'youtube',
    niche: 'tech',
    tone: 'high_energy',
    duration: '60s',
    brandSponsor: 'CreatorOS Vault',
    valueProps: 'Escrow payment protection & automated client invoicing',
  });
  const [scriptResult, setScriptResult] = useState(null);
  const [savingContent, setSavingContent] = useState(false);

  const [contractText, setContractText] = useState('');
  const [contractResult, setContractResult] = useState(null);

  const [pitchForm, setPitchForm] = useState({
    brandName: 'Nike Running',
    contactPerson: 'Director of Brand Partnerships',
    creatorNiche: 'Fitness & Everyday Athletic Gear',
    audienceSize: '185,000 active subscribers',
    deliverables: '1 Dedicated YouTube Review (10 mins) + 2 High-Paced Reels',
    proposedBudget: '₹85,000 / $2,800',
    keyAngle: 'Hands-on 100-mile marathon durability test & daily comfort review',
  });
  const [pitchResult, setPitchResult] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateScript = async (e) => {
    e.preventDefault();
    if (!scriptForm.topic) {
      toast.error('Please enter a content topic or idea.');
      return;
    }
    try {
      setLoading(true);
      const data = await genaiApi.generateScript(scriptForm);
      setScriptResult(data);
      toast.success('Viral script & hooks generated successfully!');
    } catch {
      toast.error('Failed to generate script. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToContentPlanner = async () => {
    if (!scriptResult) return;
    try {
      setSavingContent(true);
      const scriptBody = scriptResult.fullScript
        ?.map((s) => `[${s.timestamp}] ${s.sectionName}\nVisual: ${s.visualDirection}\nSpoken: "${s.spokenAudio}"`)
        .join('\n\n');

      const primaryTitle = scriptResult.titleVariations?.[0]?.title || scriptForm.topic;
      await genaiApi.saveScript({
        title: primaryTitle,
        scriptText: scriptBody,
        platform: scriptForm.platform,
        description: scriptResult.seoMetadata?.description || '',
      });
      toast.success('Script saved to Content Planner as new draft!');
    } catch {
      toast.error('Failed to save to Content Planner.');
    } finally {
      setSavingContent(false);
    }
  };

  const handleAnalyzeContract = async (e) => {
    e.preventDefault();
    if (!contractText.trim()) {
      toast.error('Please paste your brand agreement text.');
      return;
    }
    try {
      setLoading(true);
      const data = await genaiApi.analyzeContract({ contractText });
      setContractResult(data);
      toast.success('Contract risk analysis completed!');
    } catch {
      toast.error('Failed to analyze contract.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePitch = async (e) => {
    e.preventDefault();
    if (!pitchForm.brandName) {
      toast.error('Please specify the brand partner name.');
      return;
    }
    try {
      setLoading(true);
      const data = await genaiApi.generatePitch(pitchForm);
      setPitchResult(data);
      toast.success('Pitch & negotiation package created!');
    } catch {
      toast.error('Failed to generate pitch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#243f32] via-[#2b5341] to-[#1c3529] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 text-amber-300">
              <Sparkles size={16} />
            </span>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-200">
              CreatorOS Neural Intelligence Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            CreatorOS Neural Creative & Legal Due-Diligence Studio
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
            Proprietary intelligence powered by CreatorOS Neural Engine reasoning. Generate viral video hooks, audit brand contracts for legal traps, and craft high-converting sponsorship pitches.
          </p>
        </div>
      </div>

      <div className="flex border-b border-line gap-2 overflow-x-auto pb-1">
        {[
          { key: 'script', label: 'Viral Script & Hooks Studio', icon: Clapperboard },
          { key: 'contract', label: 'Contract Legal Shield & Risk Audit', icon: ShieldAlert },
          { key: 'pitch', label: 'Brand Pitch & Negotiation Engine', icon: Handshake },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[#2b5341] text-[#2b5341] font-semibold'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'script' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Lightbulb size={16} className="text-amber-500" />
              <h3 className="font-semibold text-sm text-ink">Creative Brief Configuration</h3>
            </div>

            <form onSubmit={handleGenerateScript} className="space-y-3.5 text-xs">
              <div>
                <label className="label">Topic / Concept *</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. 5 Coding Habits That Got Me Hired at Google"
                  value={scriptForm.topic}
                  onChange={(e) => setScriptForm({ ...scriptForm, topic: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Platform</label>
                  <select
                    className="input text-xs"
                    value={scriptForm.platform}
                    onChange={(e) => setScriptForm({ ...scriptForm, platform: e.target.value })}
                  >
                    <option value="youtube">YouTube (Long-Form)</option>
                    <option value="instagram">Instagram Reel</option>
                    <option value="tiktok">TikTok Video</option>
                  </select>
                </div>

                <div>
                  <label className="label">Duration</label>
                  <select
                    className="input text-xs"
                    value={scriptForm.duration}
                    onChange={(e) => setScriptForm({ ...scriptForm, duration: e.target.value })}
                  >
                    <option value="30s">30 Seconds (Fast Short)</option>
                    <option value="60s">60 Seconds (Standard Reel)</option>
                    <option value="5min">5 Minutes (Deep Dive)</option>
                    <option value="10min">10 Minutes (Full Feature)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Niche</label>
                  <select
                    className="input text-xs"
                    value={scriptForm.niche}
                    onChange={(e) => setScriptForm({ ...scriptForm, niche: e.target.value })}
                  >
                    <option value="tech">Tech & Software</option>
                    <option value="finance">Finance & Business</option>
                    <option value="lifestyle">Lifestyle & Productivity</option>
                    <option value="fitness">Fitness & Health</option>
                  </select>
                </div>

                <div>
                  <label className="label">Tone</label>
                  <select
                    className="input text-xs"
                    value={scriptForm.tone}
                    onChange={(e) => setScriptForm({ ...scriptForm, tone: e.target.value })}
                  >
                    <option value="high_energy">High Energy & Kinetic</option>
                    <option value="storytelling">Cinematic Storytelling</option>
                    <option value="educational">Clear Educational Breakdown</option>
                    <option value="humorous">Humorous & Relatable</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-line space-y-2">
                <label className="label">Brand Sponsor Integration (Optional)</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Notion, NordVPN, Nike"
                  value={scriptForm.brandSponsor}
                  onChange={(e) => setScriptForm({ ...scriptForm, brandSponsor: e.target.value })}
                />
                <input
                  className="input text-xs"
                  placeholder="Key value props: e.g. 50% discount with code CREATOROS"
                  value={scriptForm.valueProps}
                  onChange={(e) => setScriptForm({ ...scriptForm, valueProps: e.target.value })}
                />
              </div>

              <Button variant="primary" type="submit" className="w-full py-2.5 justify-center mt-2" loading={loading}>
                <Sparkles size={14} /> Generate High-Retention Script
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            {!scriptResult ? (
              <div className="card p-10 text-center space-y-3 border-dashed">
                <Clapperboard size={36} className="mx-auto text-muted" />
                <h3 className="text-sm font-semibold text-ink">Ready to Generate</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Configure your concept on the left and click Generate to produce viral hooks, timing breakdowns, and visual directions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-700" /> High-CTR Title Variations
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {scriptResult.titleVariations?.map((t, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-canvas border border-line flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{t.title}</p>
                          <p className="text-[10px] text-muted">{t.strategy}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {t.score}% CTR
                          </span>
                          <button
                            type="button"
                            className="icon-btn h-7 w-7 text-muted hover:text-ink"
                            onClick={() => copyToClipboard(t.title, `title_${idx}`)}
                            title="Copy Title"
                          >
                            {copiedId === `title_${idx}` ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500" /> Top 3 Scroll-Stopping Hooks
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {scriptResult.viralHooks?.map((h) => (
                      <div key={h.hookNumber} className="p-3 rounded-xl border border-line bg-canvas space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#2b5341]">Option {h.hookNumber}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {h.retentionScore}% Retention
                          </span>
                        </div>
                        <p className="text-[11px] text-muted italic bg-white p-2 rounded-lg border border-line">
                          <strong>Visual Cue:</strong> {h.visualCue}
                        </p>
                        <p className="text-xs text-ink font-medium">
                          &ldquo;{h.spokenAudio}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Full Timeline Scene Script
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="text-xs py-1 px-2.5"
                        onClick={() => {
                          const body = scriptResult.fullScript
                            ?.map((s) => `${s.sectionName} (${s.timestamp})\nVisual: ${s.visualDirection}\nSpoken: "${s.spokenAudio}"`)
                            .join('\n\n');
                          copyToClipboard(body, 'full_script');
                        }}
                      >
                        {copiedId === 'full_script' ? <Check size={12} /> : <Copy size={12} />} Copy Full Script
                      </Button>
                      <Button
                        variant="primary"
                        className="text-xs py-1 px-2.5"
                        onClick={handleSaveToContentPlanner}
                        loading={savingContent}
                      >
                        <FileCheck size={12} /> Save to Content Planner
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {scriptResult.fullScript?.map((scene, sIdx) => (
                      <div key={sIdx} className="p-3.5 rounded-xl border border-line bg-canvas space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-ink">{scene.sectionName}</span>
                          <span className="font-mono text-[10px] text-muted px-2 py-0.5 bg-white rounded border border-line">
                            {scene.timestamp}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-line text-[11px] text-muted">
                          <strong>Visual Direction:</strong> {scene.visualDirection}
                        </div>
                        <p className="text-xs text-ink font-medium leading-relaxed">
                          {scene.spokenAudio}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contract' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-500" />
                <h3 className="font-semibold text-sm text-ink">Contract Document Analysis</h3>
              </div>
              <button
                type="button"
                className="text-xs text-accent hover:underline font-medium"
                onClick={() => setContractText(SAMPLE_PREDATORY_CONTRACT)}
              >
                Load Sample Agreement
              </button>
            </div>

            <form onSubmit={handleAnalyzeContract} className="space-y-3 text-xs">
              <div>
                <label className="label">Paste Brand Agreement / Terms *</label>
                <textarea
                  rows={14}
                  className="input font-mono text-xs leading-relaxed"
                  placeholder="Paste contract clauses, exclusivity terms, or full sponsorship agreements here..."
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted mt-1">
                  Our legal engine checks for perpetual exclusivity, work-for-hire IP theft, Net 90 traps, and unlimited indemnification.
                </p>
              </div>

              <Button variant="primary" type="submit" className="w-full py-2.5 justify-center" loading={loading}>
                <ShieldAlert size={14} /> Run Legal Risk Audit
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            {!contractResult ? (
              <div className="card p-10 text-center space-y-3 border-dashed">
                <FileText size={36} className="mx-auto text-muted" />
                <h3 className="text-sm font-semibold text-ink">No Contract Analyzed</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Paste an agreement on the left or click &ldquo;Load Sample Agreement&rdquo; to test our automated legal risk audit.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card p-5 border-l-4 border-l-red-500 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Legal Risk Rating</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xl font-black text-red-600">
                          {contractResult.riskScore} / 100
                        </span>
                        <Badge>{contractResult.riskLevel} RISK</Badge>
                      </div>
                    </div>
                    <div className="w-full sm:w-48">
                      <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                        <div
                          style={{ width: `${contractResult.riskScore}%` }}
                          className={`h-full ${
                            contractResult.riskScore >= 70 ? 'bg-red-600' : contractResult.riskScore >= 45 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-muted text-right mt-1">Due Diligence Audit</p>
                    </div>
                  </div>

                  <p className="text-xs text-ink leading-relaxed font-medium bg-canvas p-3 rounded-xl border border-line">
                    {contractResult.summary}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-500" /> Flagged Hazardous Clauses ({contractResult.flaggedClauses?.length || 0})
                  </h4>

                  {contractResult.flaggedClauses?.map((clause, cIdx) => (
                    <div key={cIdx} className="card p-4 space-y-3 border border-line">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-ink">{clause.clauseName}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            clause.severity === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : clause.severity === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {clause.severity} SEVERITY
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 text-[11px] text-red-900 dark:text-red-300">
                        <strong>Original Clause Language:</strong>
                        <p className="font-mono text-[10px] mt-1 italic">&ldquo;{clause.originalText}&rdquo;</p>
                      </div>

                      <div className="text-xs text-muted leading-relaxed">
                        <strong className="text-ink">Why This Hurts You:</strong> {clause.riskExplanation}
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 text-xs text-emerald-950 dark:text-emerald-300 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-[11px] uppercase tracking-wider text-emerald-800">
                            Recommended Redline Counter-Clause:
                          </strong>
                          <button
                            type="button"
                            className="text-xs text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 font-semibold"
                            onClick={() => copyToClipboard(clause.suggestedRevision, `rev_${cIdx}`)}
                          >
                            {copiedId === `rev_${cIdx}` ? <Check size={12} /> : <Copy size={12} />} Copy Counter Clause
                          </button>
                        </div>
                        <p className="font-mono text-[11px] leading-relaxed bg-white/80 dark:bg-black/40 p-2 rounded-lg border border-emerald-200/50">
                          {clause.suggestedRevision}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {contractResult.actionItems?.length > 0 && (
                  <div className="card p-4 space-y-2 bg-canvas">
                    <h5 className="font-semibold text-xs text-ink uppercase tracking-wider">
                      Negotiation Action Checklist
                    </h5>
                    <ul className="space-y-1 text-xs text-muted list-disc list-inside">
                      {contractResult.actionItems.map((item, aIdx) => (
                        <li key={aIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pitch' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Handshake size={16} className="text-[#2b5341]" />
              <h3 className="font-semibold text-sm text-ink">Sponsorship Pitch Parameters</h3>
            </div>

            <form onSubmit={handleGeneratePitch} className="space-y-3.5 text-xs">
              <div>
                <label className="label">Target Brand Name *</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Sony Electronics"
                  value={pitchForm.brandName}
                  onChange={(e) => setPitchForm({ ...pitchForm, brandName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Contact Person</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. Riya (Partnerships Lead)"
                    value={pitchForm.contactPerson}
                    onChange={(e) => setPitchForm({ ...pitchForm, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Audience Size</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. 150,000 subscribers"
                    value={pitchForm.audienceSize}
                    onChange={(e) => setPitchForm({ ...pitchForm, audienceSize: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Creator Niche</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Tech, SaaS & Workspaces"
                  value={pitchForm.creatorNiche}
                  onChange={(e) => setPitchForm({ ...pitchForm, creatorNiche: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Deliverables Package</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. 1 Dedicated YouTube Video + 2 Instagram Reels"
                  value={pitchForm.deliverables}
                  onChange={(e) => setPitchForm({ ...pitchForm, deliverables: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Proposed Fee / Rate</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. $2,500 / ₹75,000"
                    value={pitchForm.proposedBudget}
                    onChange={(e) => setPitchForm({ ...pitchForm, proposedBudget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Campaign Angle / Hook</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. 30-day productivity test"
                    value={pitchForm.keyAngle}
                    onChange={(e) => setPitchForm({ ...pitchForm, keyAngle: e.target.value })}
                  />
                </div>
              </div>

              <Button variant="primary" type="submit" className="w-full py-2.5 justify-center mt-2" loading={loading}>
                <Send size={14} /> Generate High-Converting Pitch
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            {!pitchResult ? (
              <div className="card p-10 text-center space-y-3 border-dashed">
                <Handshake size={36} className="mx-auto text-muted" />
                <h3 className="text-sm font-semibold text-ink">Ready to Pitch Brands</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Fill in your partner target details on the left to generate cold emails, follow-up bumps, and objection rebuttals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    High Open-Rate Email Subject Lines
                  </h4>
                  <div className="space-y-2">
                    {pitchResult.emailSubjectLines?.map((sub, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-canvas border border-line flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">{sub}</span>
                        <button
                          type="button"
                          className="icon-btn h-7 w-7 text-muted hover:text-ink"
                          onClick={() => copyToClipboard(sub, `sub_${idx}`)}
                          title="Copy Subject"
                        >
                          {copiedId === `sub_${idx}` ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Cold Collaboration Email Pitch
                    </h4>
                    <Button
                      variant="secondary"
                      className="text-xs py-1 px-2.5"
                      onClick={() => copyToClipboard(pitchResult.coldEmailPitch, 'cold_pitch')}
                    >
                      {copiedId === 'cold_pitch' ? <Check size={12} /> : <Copy size={12} />} Copy Email Pitch
                    </Button>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap text-xs text-ink leading-relaxed p-3.5 rounded-xl bg-canvas border border-line">
                    {pitchResult.coldEmailPitch}
                  </pre>
                </div>

                <div className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      4-Day Follow-Up Sequence Bump
                    </h4>
                    <Button
                      variant="secondary"
                      className="text-xs py-1 px-2.5"
                      onClick={() => copyToClipboard(pitchResult.followUpEmail, 'follow_up')}
                    >
                      {copiedId === 'follow_up' ? <Check size={12} /> : <Copy size={12} />} Copy Follow-Up
                    </Button>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap text-xs text-ink leading-relaxed p-3.5 rounded-xl bg-canvas border border-line">
                    {pitchResult.followUpEmail}
                  </pre>
                </div>

                <div className="card p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <ArrowRight size={13} className="text-[#2b5341]" /> Brand Objection Handling Tactician
                  </h4>
                  <div className="space-y-3">
                    {pitchResult.objectionHandlers?.map((obj, oIdx) => (
                      <div key={oIdx} className="p-3 rounded-xl border border-line bg-canvas space-y-2 text-xs">
                        <p className="font-bold text-ink text-xs">{obj.objection}</p>
                        <p className="text-[11px] text-muted italic">
                          <strong>Strategy:</strong> {obj.counterStrategy}
                        </p>
                        <div className="p-2.5 rounded-lg bg-white border border-line space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-muted uppercase font-semibold">
                            <span>Ready Rebuttal Reply</span>
                            <button
                              type="button"
                              className="text-accent hover:underline flex items-center gap-1"
                              onClick={() => copyToClipboard(obj.suggestedReply, `obj_${oIdx}`)}
                            >
                              {copiedId === `obj_${oIdx}` ? <Check size={11} /> : <Copy size={11} />} Copy Reply
                            </button>
                          </div>
                          <p className="text-xs text-ink">{obj.suggestedReply}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
