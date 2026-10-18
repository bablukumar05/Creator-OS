import crypto from 'node:crypto';
import { models, Activity } from '../models/resources.js';
import { resources } from '../../shared/resources.js';
import { logAuditEvent } from '../src/modules/audit/audit.service.js';
import { ApiError } from '../utils/http.js';
export async function validateRelations(key, data, owner, organizationId = null) {
  const scopeFilter = organizationId
    ? { $or: [{ organizationId }, { organizationId: null, owner }], deletedAt: null }
    : { owner, deletedAt: null };
  for (const f of resources[key].fields.filter((f) => f.type === 'relation')) {
    if (
      data[f.key] &&
      !(await models[f.resource].exists({ _id: data[f.key], ...scopeFilter }))
    )
      throw new ApiError(400, `Select a valid ${f.label.toLowerCase()} from your workspace.`);
  }
}
export function invoiceTotals(data) {
  const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const subtotal = round(data.items.reduce((sum, item) => sum + item.quantity * item.rate, 0));
  if ((data.discount || 0) > subtotal) throw new ApiError(400, 'Discount cannot exceed subtotal.');
  return {
    subtotal,
    amount: round((subtotal - (data.discount || 0)) * (1 + (data.tax || 0) / 100)),
  };
}
export const invoiceNumber = () =>
  `INV-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
export async function recordActivity(req, title, resource, resourceId, metadata = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const verb = String(title).split(' ')[0]?.toLowerCase() || 'mutated';
  await Promise.all([
    Activity.create({
      owner: ownerId,
      organizationId: req.organizationId || null,
      createdBy: req.user._id,
      title,
      resource,
      resourceId,
    }),
    logAuditEvent({
      organizationId: req.organizationId || null,
      actorId: req.user._id,
      action: `${resource}.${verb}`,
      resourceType: resource,
      resourceId,
      metadata: { title, ...metadata },
    }),
  ]);
  req.app.get('io')?.to(String(ownerId)).emit('workspace:updated', { resource });
}