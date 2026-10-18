import { AuditLog } from './audit.model.js';
export async function logAuditEvent({
  organizationId = null,
  actorId,
  action,
  resourceType,
  resourceId = null,
  metadata = {},
}) {
  if (!actorId || !action || !resourceType) return null;
  return AuditLog.create({
    organizationId: organizationId || null,
    actorId,
    action,
    resourceType,
    resourceId: resourceId || null,
    metadata,
  });
}
export async function listOrganizationAuditLogs(organizationId, query = {}) {
  const filter = { organizationId };
  if (query.resourceType) filter.resourceType = String(query.resourceType);
  if (query.action) filter.action = String(query.action);
  if (query.actorId && /^[a-f\d]{24}$/i.test(String(query.actorId))) {
    filter.actorId = String(query.actorId);
  }
  const page = Math.max(1, Number.parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit) || 25));
  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actorId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}
