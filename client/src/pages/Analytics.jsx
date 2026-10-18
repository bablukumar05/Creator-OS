import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  Wallet,
  Zap,
  RefreshCw,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Loading, ErrorState, StatCard } from '../components/ui';
import { analyticsApi } from '../services/analyticsApi';
import { AIAssistantDrawer } from '../components/ai/AIAssistantDrawer';
export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executive, setExecutive] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [risks, setRisks] = useState([]);
  const [creators, setCreators] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);
  useEffect(() => {
    fetchAllAnalytics();
  }, []);
  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [execData, forecastData, riskData, creatorData] = await Promise.all([
        analyticsApi.getExecutive(),
        analyticsApi.getForecast(),
        analyticsApi.getRisks(),
        analyticsApi.getCreators(),
      ]);
      setExecutive(execData);
      setForecast(forecastData);
      setRisks(riskData.items || []);
      setCreators(creatorData.items || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  const handleMarkInsightRead = async (id) => {
    try {
      await analyticsApi.markInsightRead(id);
      toast.success('Insight marked as resolved.');
      fetchAllAnalytics();
    } catch (err) {
      toast.error('Failed to update insight.');
    }
  };
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} retry={fetchAllAnalytics} />;
  const kpis = executive?.kpis || {};
  const insights = executive?.insights || [];
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#2b5341] to-[#1a382c] text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 text-amber-300">
              <Sparkles size={18} />
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-200">Phase 8 Intelligence Layer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Executive Analytics & Intelligence</h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl">
            Real-time business performance analytics, automated risk engine, 7-factor creator scoring, and AI forecasting.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" onClick={fetchAllAnalytics} className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button onClick={() => setAiOpen(true)} className="bg-amber-400 text-ink hover:bg-amber-300 border-none font-semibold text-xs">
            <Sparkles size={14} className="text-amber-900" /> Open AI Assistant
          </Button>
        </div>
      </div>
      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${kpis.revenue?.toLocaleString() || 0}`} icon={Wallet} detail="Paid invoices total" />
        <StatCard label="Overdue Exposure" value={`$${kpis.overdueRevenue?.toLocaleString() || 0}`} icon={AlertTriangle} detail={`${kpis.overdueInvoicesCount || 0} overdue invoice(s)`} />
        <StatCard label="Active Campaigns" value={kpis.activeCampaigns || 0} icon={Zap} detail={`out of ${kpis.totalCampaigns || 0} total`} />
        <StatCard label="Total Creators" value={kpis.totalCreators || 0} icon={Users} detail="Verified roster database" />
      </div>
      {}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> Proactive AI Insight Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <div key={insight._id} className="card p-4 space-y-3 border-l-4 border-l-amber-500 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 tracking-wider">
                      {insight.type} • {insight.category}
                    </span>
                    <h3 className="font-semibold text-sm text-ink">{insight.title}</h3>
                  </div>
                  <Badge>{insight.severity}</Badge>
                </div>
                <p className="text-xs text-muted leading-relaxed">{insight.description}</p>
                {insight.recommendation && (
                  <div className="p-2.5 rounded-xl bg-canvas border border-line text-xs font-medium text-ink flex items-center justify-between gap-2">
                    <span>💡 {insight.recommendation}</span>
                    <button onClick={() => handleMarkInsightRead(insight._id)} className="text-[10px] text-emerald-600 font-bold hover:underline shrink-0">
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        {forecast && (
          <div className="card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-emerald-600" /> Next Month Revenue Forecast
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {forecast.confidenceScore}% Confidence
                </span>
              </div>
              <p className="text-xs text-muted">Weighted moving average projection incorporating pipeline contracts & historical growth.</p>
            </div>
            <div className="p-5 rounded-2xl bg-canvas border border-line space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted">Expected Projection</span>
                <span className="text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                  ${forecast.forecastRevenue?.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line text-xs">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Best Case Scenario</span>
                  <span className="font-semibold text-ink">${forecast.bestCaseRevenue?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">Worst Case Scenario</span>
                  <span className="font-semibold text-ink">${forecast.worstCaseRevenue?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-muted flex items-center justify-between pt-1">
              <span>Method: {forecast.method}</span>
              <span className="text-ink font-medium">Updated today</span>
            </div>
          </div>
        )}
        {}
        <div className="card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-amber-500" /> Operational & Payment Risk Center
            </h3>
            <p className="text-xs text-muted">Automated risk signals for active campaigns and overdue payments.</p>
          </div>
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-56">
            {risks.length === 0 ? (
              <p className="text-xs text-muted p-6 text-center">No high or critical risks detected.</p>
            ) : (
              risks.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-line bg-canvas flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-ink truncate">{item.targetName}</p>
                    <p className="text-[10px] text-muted truncate">{item.factors?.[0]?.description || 'Risk signal detected.'}</p>
                  </div>
                  <Badge>{item.riskLevel}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-1.5">
              <Award size={16} className="text-purple-600" /> Creator Performance Score Leaderboard
            </h3>
            <p className="text-xs text-muted">7-factor weighted evaluation (Engagement, Growth, Reach, Quality, Reliability, ROI, Audience Fit).</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-line text-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3">Creator</th>
                <th className="p-3">Performance Score</th>
                <th className="p-3">Engagement Rate</th>
                <th className="p-3">Reach</th>
                <th className="p-3">Min Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {creators.slice(0, 5).map((c) => (
                <tr key={c.creatorId} className="hover:bg-canvas/50">
                  <td className="p-3 font-semibold text-ink">
                    {c.displayName} <span className="text-muted font-normal">(@{c.username})</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-xs">
                      {c.performanceScore} / 100
                    </span>
                  </td>
                  <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400">
                    {c.engagementRate}%
                  </td>
                  <td className="p-3 text-muted">
                    {c.followers?.toLocaleString() || 0}
                  </td>
                  <td className="p-3 font-medium">
                    ${c.minimumBudget?.toLocaleString() || 500}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#2b5341] to-[#1e3b2e] text-white shadow-2xl hover:scale-105 transition-all cursor-pointer border border-white/20"
      >
        <Sparkles size={18} className="text-amber-300 animate-pulse" />
        <span className="text-xs font-bold tracking-tight">Ask CreatorOS AI</span>
      </button>
      {}
      <AIAssistantDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
