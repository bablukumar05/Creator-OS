import { Expense, Revenue } from './finance.model.js';
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
function createFinanceModelRepository(Model) {
  return {
    async findAllByOrganization(
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
        Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Model.countDocuments(filter),
      ]);
      return { items, total };
    },
    async findByIdWithinOrganization(
      recordId,
      organizationId,
      ownerId,
      { includeDeleted = false, lean = false } = {},
    ) {
      const query = Model.findOne({
        _id: recordId,
        ...buildTenantFilter(organizationId, ownerId, { includeDeleted }),
      });
      return lean ? query.lean() : query;
    },
    async createForOrganization(data, organizationId, ownerId, actorUserId) {
      return Model.create({
        ...data,
        owner: ownerId,
        organizationId: organizationId || null,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      });
    },
    async archiveWithinOrganization(recordId, organizationId, ownerId, actorUserId) {
      return Model.findOneAndUpdate(
        {
          _id: recordId,
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
    },
    async restoreWithinOrganization(recordId, organizationId, ownerId, actorUserId) {
      return Model.findOneAndUpdate(
        {
          _id: recordId,
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
    },
  };
}
export const revenueRepository = createFinanceModelRepository(Revenue);
export const expenseRepository = createFinanceModelRepository(Expense);
export { buildTenantFilter };
