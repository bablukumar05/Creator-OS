export const ORGANIZATION_TYPES = Object.freeze(['creator_workspace', 'agency', 'brand_team']);
export const ORGANIZATION_STATUSES = Object.freeze(['active', 'suspended', 'archived']);
export const ORGANIZATION_CURRENCIES = Object.freeze(['INR', 'USD', 'EUR', 'GBP']);
export function slugifyOrganizationName(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
