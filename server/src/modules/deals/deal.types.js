import { DEAL_PAYMENT_STATUSES, DEAL_STATUSES } from './deal.constants.js';
export { DEAL_PAYMENT_STATUSES, DEAL_STATUSES };
export function normalizeDealPayload(payload = {}) {
  const normalized = { ...payload };
  if (normalized.brandId && !normalized.brand) {
    normalized.brand = normalized.brandId;
  } else if (normalized.brand && !normalized.brandId) {
    normalized.brandId = normalized.brand;
  }
  return normalized;
}
