import { CONTENT_STATUSES, CONTENT_TYPES } from './content.constants.js';
export { CONTENT_STATUSES, CONTENT_TYPES };



export function normalizeContentPayload(payload = {}) {
  const normalized = { ...payload };
  if (normalized.campaignId && !normalized.campaign) {
    normalized.campaign = normalized.campaignId;
  } else if (normalized.campaign && !normalized.campaignId) {
    normalized.campaignId = normalized.campaign;
  }
  if (normalized.contentType && !normalized.type) {
    normalized.type = normalized.contentType;
  } else if (normalized.type && !normalized.contentType) {
    normalized.contentType = normalized.type;
  }
  if (normalized.dueDate && !normalized.publishDate) {
    normalized.publishDate = normalized.dueDate;
  } else if (normalized.publishDate && !normalized.dueDate) {
    normalized.dueDate = normalized.publishDate;
  }
  return normalized;
}
