import * as analyticsService from './analytics.service.js';
import { sendSuccess } from '../../../utils/http.js';
export async function getExecutive(req, res) {
  const data = await analyticsService.getExecutiveSummary(req);
  sendSuccess(res, 200, data, 'Executive summary loaded successfully.');
}
export async function getRevenue(req, res) {
  const data = await analyticsService.getCampaignROI(req);
  sendSuccess(res, 200, data, 'Revenue analytics loaded successfully.');
}
export async function getCampaigns(req, res) {
  const data = await analyticsService.getCampaignROI(req);
  sendSuccess(res, 200, data, 'Campaign analytics loaded successfully.');
}
export async function getCreators(req, res) {
  const data = await analyticsService.getCreatorAnalytics(req);
  sendSuccess(res, 200, data, 'Creator analytics loaded successfully.');
}
export async function getBrands(req, res) {
  const data = await analyticsService.getBrandAnalytics(req);
  sendSuccess(res, 200, data, 'Brand analytics loaded successfully.');
}
export async function getRisks(req, res) {
  const data = await analyticsService.getRiskAnalysis(req);
  sendSuccess(res, 200, data, 'Risk analysis loaded successfully.');
}
export async function getForecast(req, res) {
  const data = await analyticsService.getRevenueForecast(req);
  sendSuccess(res, 200, data, 'Revenue forecast loaded successfully.');
}
export async function markInsightRead(req, res) {
  const data = await analyticsService.markInsightAsRead(req, req.params.id);
  sendSuccess(res, 200, data, 'Insight marked as read.');
}
