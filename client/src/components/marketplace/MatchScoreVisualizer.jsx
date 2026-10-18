import { CheckCircle2, Sparkles, TrendingUp, DollarSign, Star, Zap } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';
export function MatchScoreVisualizer({ match, campaignName, onClose, onSendOffer, onInvite }) {
  if (!match) return null;
  const { creator, score, reasons } = match;
  const isHighMatch = score >= 80;
  const isMedMatch = score >= 60;
  const scoreColor = isHighMatch ? '#2b5341' : isMedMatch ? '#b49b62' : '#6b7280';
  const badgeText = isHighMatch ? 'Strong Match' : isMedMatch ? 'Moderate Match' : 'Potential Fit';
  return (
    <Modal title={`AI Match Analysis: ${creator.displayName}`} onClose={onClose} wide>
      <div className="space-y-6">
        {}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-canvas border border-line">
          {}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width="100" height="100" className="-rotate-90">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-line" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * score) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tracking-tight">{score}%</span>
              <span className="text-[10px] uppercase tracking-wider text-muted">Score</span>
            </div>
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge>{badgeText}</Badge>
              {creator.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
                  <CheckCircle2 size={12} /> Verified Creator
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{creator.displayName}</h3>
            <p className="text-xs text-muted">
              Campaign: <span className="font-medium text-ink">{campaignName || 'Selected Campaign'}</span>
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted pt-1">
              <span className="flex items-center gap-1"><Star size={13} className="text-amber-500 fill-amber-500" /> {creator.rating || 5.0} Client Rating</span>
              <span className="flex items-center gap-1"><DollarSign size={13} /> Min Budget: ${creator.minimumBudget?.toLocaleString() || 500}</span>
              <span className="flex items-center gap-1"><Zap size={13} className="text-emerald-500" /> {creator.availabilityStatus || 'Available'}</span>
            </div>
          </div>
        </div>
        {}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" /> AI Score Breakdown & Match Factors
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-card hover:bg-canvas transition-colors">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{reason}</p>
                    <p className="text-xs text-muted mt-0.5">Contributes positively to campaign synergy and ROI alignment.</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted p-4 text-center">Standard baseline fit based on platform standards.</p>
            )}
          </div>
        </div>
        {}
        <div className="p-4 rounded-xl border border-line bg-canvas/50 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted">Primary Platforms</span>
            <div className="flex flex-wrap gap-1.5">
              {creator.platforms?.map((p) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-md bg-card border border-line font-medium">{p}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted">Categories</span>
            <div className="flex flex-wrap gap-1.5">
              {creator.categories?.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-md bg-card border border-line font-medium">{c}</span>
              ))}
            </div>
          </div>
        </div>
        {}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-line">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {onInvite && (
            <Button variant="secondary" onClick={() => onInvite(creator)}>
              Invite to Campaign
            </Button>
          )}
          {onSendOffer && (
            <Button variant="primary" onClick={() => onSendOffer(creator)}>
              <TrendingUp size={15} /> Send Campaign Offer
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
