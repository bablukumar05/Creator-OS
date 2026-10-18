import { Content } from './content.model.js';
function buildTenantFilter(organizationId, ownerId, { includeDeleted = false } = {}) {
  const deletedAt = includeDeleted ? { $ne: null } : null;
  if (!organizationId) {
    return { owner: ownerId, deletedAt };
  }
  return {
    $or: [
      { organizationId },
      { organizationId: null, owner: ownerId },
    ],
    deletedAt,
  };
}
export async function findAllByOrganization(
  organizationId,
  ownerId,
  criteria = {},
  { includeDeleted = false, sort = '-createdAt', skip = 0, limit = 10 } = {},
) {
  const filter = {
    ...buildTenantFilter(organizationId, ownerId, { includeDeleted }),
    ...criteria,
  };
  const [items, total] = await Promise.all([
    Content.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Content.countDocuments(filter),
  ]);
  return { items, total };
}
export async function findByIdWithinOrganization(
  contentId,
  organizationId,
  ownerId,
  { includeDeleted = false, lean = false } = {},
) {
  const query = Content.findOne({
    _id: contentId,
    ...buildTenantFilter(organizationId, ownerId, { includeDeleted }),
  });
  return lean ? query.lean() : query;
}
export async function createForOrganization(data, organizationId, ownerId, actorUserId) {
  return Content.create({
    ...data,
    owner: ownerId,
    organizationId: organizationId || null,
    createdBy: actorUserId,
    updatedBy: actorUserId,
  });
}
export async function archiveWithinOrganization(contentId, organizationId, ownerId, actorUserId) {
  return Content.findOneAndUpdate(
    {
      _id: contentId,
      ...buildTenantFilter(organizationId, ownerId, { includeDeleted: false }),
    },
    {
      $set: {
        deletedAt: new Date(),
        updatedBy: actorUserId,
      },
    },
    { new: true },
  );
}
export async function restoreWithinOrganization(contentId, organizationId, ownerId, actorUserId) {
  return Content.findOneAndUpdate(
    {
      _id: contentId,
      ...buildTenantFilter(organizationId, ownerId, { includeDeleted: true }),
    },
    {
      $set: {
        deletedAt: null,
        updatedBy: actorUserId,
      },
    },
    { new: true },
  );
}
