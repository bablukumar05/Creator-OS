import { Organization } from './organization.model.js';
import { Session } from '../auth/session.model.js';
export async function createOrganizationRecord(data) {
  return Organization.create(data);
}
export async function findActiveOrganizationById(organizationId) {
  return Organization.findOne({
    _id: organizationId,
    status: 'active',
    deletedAt: null,
  });
}
export async function findActiveOrganizationsByIds(organizationIds) {
  if (!organizationIds.length) return [];
  return Organization.find({
    _id: { $in: organizationIds },
    status: 'active',
    deletedAt: null,
  }).lean();
}
export async function findOrganizationBySlug(slug) {
  return Organization.findOne({ slug, deletedAt: null });
}
export async function slugExists(slug) {
  return Boolean(await Organization.exists({ slug }));
}
export async function updateOrganizationById(organizationId, updates) {
  return Organization.findOneAndUpdate(
    { _id: organizationId, deletedAt: null },
    { $set: updates },
    { new: true, runValidators: true },
  );
}
export async function bindSessionOrganization(sessionId, userId, organizationId) {
  if (!sessionId) return null;
  return Session.findOneAndUpdate(
    { _id: sessionId, userId },
    { $set: { activeOrganizationId: organizationId, lastUsedAt: new Date() } },
    { new: true },
  );
}
