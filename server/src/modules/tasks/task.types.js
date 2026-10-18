import { TASK_PRIORITIES, TASK_STATUSES } from './task.constants.js';
export { TASK_PRIORITIES, TASK_STATUSES };
export function normalizeTaskPayload(payload = {}) {
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
  if (normalized.contentId && !normalized.content) {
    normalized.content = normalized.contentId;
  } else if (normalized.content && !normalized.contentId) {
    normalized.contentId = normalized.content;
  }
  return normalized;
}
