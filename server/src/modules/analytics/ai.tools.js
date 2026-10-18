import {
  getExecutiveSummary,
  getCampaignROI,
  getCreatorAnalytics,
  getBrandAnalytics,
  getRiskAnalysis,
  getRevenueForecast,
} from './analytics.service.js';
export const AI_TOOLS = {
  getExecutiveSummary: {
    description: 'Get high-level executive overview including total revenue, active campaigns, overdue invoices, and AI insights.',
    execute: async (req) => getExecutiveSummary(req),
  },
  getCampaignPerformance: {
    description: 'Get campaign ROI, profit margins, cost breakdowns, and ROAS metrics.',
    execute: async (req) => getCampaignROI(req),
  },
  getCreatorPerformance: {
    description: 'Get top creator performance scores (0-100), engagement rates, and 7-factor breakdowns.',
    execute: async (req) => getCreatorAnalytics(req),
  },
  getBrandPerformance: {
    description: 'Get brand deals, payment reliability, repeat client rates, and revenue per brand.',
    execute: async (req) => getBrandAnalytics(req),
  },
  getCampaignRisks: {
    description: 'Get at-risk campaigns and overdue payment risk signals.',
    execute: async (req) => getRiskAnalysis(req),
  },
  getRevenueForecast: {
    description: 'Get weighted moving average revenue predictions for upcoming periods with best/worst case scenarios.',
    execute: async (req) => getRevenueForecast(req),
  },
};
