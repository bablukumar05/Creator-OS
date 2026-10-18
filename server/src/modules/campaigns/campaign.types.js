import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from './campaign.constants.js';
export { CAMPAIGN_STATUSES, CAMPAIGN_TYPES };




export function normalizeCampaignPayload(payload = {}) {
  const normalized = { ...payload };
  if (normalized.name && !normalized.title) {
    normalized.title = normalized.name;
  } else if (normalized.title && !normalized.name) {
    normalized.name = normalized.title;
  }
  if (normalized.brandId && !normalized.brand) {
    normalized.brand = normalized.brandId;
  } else if (normalized.brand && !normalized.brandId) {
    normalized.brandId = normalized.brand;
  }
  return normalized;
}
