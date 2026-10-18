import {
  EXPENSE_CATEGORIES,
  REVENUE_CATEGORIES,
  REVENUE_STATUSES,
} from './finance.constants.js';
export { EXPENSE_CATEGORIES, REVENUE_CATEGORIES, REVENUE_STATUSES };
export function normalizeFinancePayload(payload = {}) {
  const normalized = { ...payload };
  if (normalized.brandId && !normalized.brand) {
    normalized.brand = normalized.brandId;
  } else if (normalized.brand && !normalized.brandId) {
    normalized.brandId = normalized.brand;
  }
  if (normalized.campaignId && !normalized.campaign) {
    normalized.campaign = normalized.campaignId;
  } else if (normalized.campaign && !normalized.campaignId) {
    normalized.campaignId = normalized.campaign;
  }
  return normalized;
}
