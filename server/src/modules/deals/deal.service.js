import { DEAL_SORT_FIELDS } from './deal.constants.js';
import {
  archiveWithinOrganization,
  createForOrganization,
  findAllByOrganization,
  findByIdWithinOrganization,
  restoreWithinOrganization,
} from './deal.repository.js';
import { findByIdWithinOrganization as findBrandByIdWithinOrganization } from '../brands/brand.repository.js';
import { models } from '../../../models/resources.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_FIELDS = [
  'brand',
  'brandId',
  'description',
  'startDate',
  'deadline',
  'paymentDueDate',
  'deliverables',
  'contract',
  'notes',
];
async function verifyDealRelations(data, organizationId, ownerId) {
  const targetBrandId = data.brand || data.brandId;
  if (targetBrandId) {
    const brand = await findBrandByIdWithinOrganization(targetBrandId, organizationId, ownerId, {
      lean: true,
    });
    if (!brand) {
      throw new ApiError(400, 'Select a valid brand from your workspace.');
    }
    data.brand = brand._id;
    data.brandId = brand._id;
  }
  if (data.contract) {
    const mediaScopeFilter = organizationId
      ? { $or: [{ organizationId }, { organizationId: null, owner: ownerId }], deletedAt: null }
      : { owner: ownerId, deletedAt: null };
    const exists = await models.media.exists({ _id: data.contract, ...mediaScopeFilter });
    if (!exists) {
      throw new ApiError(400, 'Select a valid contract asset from your workspace.');
    }
  }
}
export async function listDeals(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const includeDeleted = req.query.archived === 'true';
  const criteria = {};
  if (req.query.search) {
    criteria.title = {
      $regex: escapeRegex(String(req.query.search).slice(0, 100)),
      $options: 'i',
    };
  }
  if (req.query.status) criteria.status = String(req.query.status);
  if (req.query.paymentStatus) criteria.paymentStatus = String(req.query.paymentStatus);
  const brandFilter = req.query.brand || req.query.brandId;
  if (brandFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(brandFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.brand = String(brandFilter);
  }
  if (req.query.contract) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.contract))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.contract = String(req.query.contract);
  }
  if (req.query.from || req.query.to) {
    criteria.createdAt = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      if (!Number.isFinite(+from)) throw new ApiError(400, 'Invalid start date.');
      criteria.createdAt.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (!Number.isFinite(+to)) throw new ApiError(400, 'Invalid end date.');
      criteria.createdAt.$lte = to;
    }
  }
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
  const rawSort = String(req.query.sort || '-createdAt');
  const sortField = rawSort.replace(/^-/, '');
  const sort = DEAL_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
  const { items, total } = await findAllByOrganization(req.organizationId, ownerId, criteria, {
    includeDeleted,
    sort,
    skip: (page - 1) * limit,
    limit,
  });
  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}
export async function getDealById(req, dealId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const deal = await findByIdWithinOrganization(dealId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!deal) throw new ApiError(404, 'Record not found.');
  return deal;
}
export async function createDeal(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyDealRelations(data, req.organizationId, ownerId);
  const deal = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Created ${deal.title}`, 'deals', deal._id);
  return deal;
}
export async function updateDeal(req, dealId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const deal = await findByIdWithinOrganization(dealId, req.organizationId, ownerId);
  if (!deal) throw new ApiError(404, 'Record not found.');
  await verifyDealRelations(data, req.organizationId, ownerId);
  Object.assign(deal, data);
  deal.updatedBy = req.user._id;
  for (const field of CLEARABLE_FIELDS) {
    if (rawBody[field] === '') {
      deal.set(field, undefined);
      if (field === 'brand' || field === 'brandId') {
        deal.set('brand', undefined);
        deal.set('brandId', undefined);
      }
    }
  }
  await deal.save();
  await recordActivity(req, `Updated ${deal.title}`, 'deals', deal._id);
  return deal;
}
export async function archiveDeal(req, dealId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const deal = await archiveWithinOrganization(
    dealId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!deal) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${deal.title}`, 'deals', deal._id);
  return deal;
}
export async function duplicateDeal(req, dealId) {
  const original = await getDealById(req, dealId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  data.title = `${original.title} (copy)`;
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Duplicated ${original.title}`, 'deals', copy._id);
  return copy;
}
export async function restoreDeal(req, dealId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const deal = await restoreWithinOrganization(
    dealId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!deal) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${deal.title}`, 'deals', deal._id);
  return deal;
}
