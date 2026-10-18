import { CONTRACT_STATUSES } from './contract.constants.js';
export { CONTRACT_STATUSES };
export function normalizeContractPayload(payload = {}) {
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
  if (normalized.dealId && !normalized.deal) {
    normalized.deal = normalized.dealId;
  } else if (normalized.deal && !normalized.dealId) {
    normalized.dealId = normalized.deal;
  }
  return normalized;
}
