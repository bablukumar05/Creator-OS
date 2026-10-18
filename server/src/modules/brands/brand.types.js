export function normalizeBrandPayload(data = {}) {
  const normalized = { ...data };
  const resolvedName = (normalized.name || normalized.title || '').trim();
  if (resolvedName) {
    normalized.name = resolvedName;
    normalized.title = resolvedName;
  }
  return normalized;
}
