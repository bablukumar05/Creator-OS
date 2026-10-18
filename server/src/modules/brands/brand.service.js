import { BRAND_SORT_FIELDS } from './brand.constants.js';
import {
  archiveWithinOrganization,
  createForOrganization,
  findAllByOrganization,
  findByIdWithinOrganization,
  restoreWithinOrganization,
} from './brand.repository.js';
import { Brand } from './brand.model.js';
import { Communication } from './communications/communication.model.js';
import { logBrandActivity } from './activities/activity.service.js';
import { models } from '../../../models/resources.js';
import { resources } from '../../../../shared/resources.js';
import { recordActivity } from '../../../services/resourceService.js';
import { tenantScope } from '../../middleware/organization.middleware.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_FIELDS = [
  'logo',
  'website',
  'industry',
  'description',
  'contactPerson',
  'contactEmail',
  'contactPhone',
  'notes',
  'assignedTo',
  'country',
  'city',
];
export async function listBrands(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const includeDeleted = req.query.archived === 'true';
  const criteria = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).slice(0, 100)), 'i');
    criteria.$or = [
      { title: rx },
      { name: rx },
      { contactPerson: rx },
      { contactEmail: rx },
      { industry: rx },
      { tags: rx },
    ];
  }
  if (req.query.status) criteria.status = String(req.query.status);
  if (req.query.industry) criteria.industry = String(req.query.industry);
  if (req.query.source) criteria.source = String(req.query.source);
  if (req.query.priority) criteria.priority = String(req.query.priority);
  if (req.query.assignedTo) criteria.assignedTo = String(req.query.assignedTo);
  if (req.query.country) criteria.country = String(req.query.country);
  if (req.query.companySize) criteria.companySize = String(req.query.companySize);
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
  const sort = BRAND_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
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
export async function getBrandById(req, brandId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await findByIdWithinOrganization(brandId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!brand) throw new ApiError(404, 'Record not found.');
  return brand;
}
export async function getBrandRelatedRecords(req, brandId) {
  const brand = await getBrandById(req, brandId);
  const scopeFilter = tenantScope(req);
  const groups = await Promise.all(
    Object.entries(resources)
      .filter(([, config]) => config.fields.some((f) => f.key === 'brand'))
      .map(async ([key, config]) => {
        const filter = { ...scopeFilter, brand: brand._id };
        const [items, total] = await Promise.all([
          models[key]
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title status amount')
            .lean(),
          models[key].countDocuments(filter),
        ]);
        return { resource: key, label: config.label, items, total };
      }),
  );
  return groups.filter((group) => group.total > 0);
}
export async function createBrand(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Created ${brand.title}`, 'brands', brand._id);
  await logBrandActivity({
    organizationId: req.organizationId,
    brandId: brand._id,
    actorId: req.user._id,
    action: 'Brand Created',
    metadata: { name: brand.name, status: brand.status, source: brand.source },
  });
  return brand;
}
export async function updateBrand(req, brandId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await findByIdWithinOrganization(brandId, req.organizationId, ownerId);
  if (!brand) throw new ApiError(404, 'Record not found.');
  const oldStatus = brand.status;
  Object.assign(brand, data);
  brand.updatedBy = req.user._id;
  for (const field of CLEARABLE_FIELDS) {
    if (rawBody[field] === '') {
      brand.set(field, undefined);
    }
  }
  await brand.save();
  await recordActivity(req, `Updated ${brand.title}`, 'brands', brand._id);
  if (data.status && data.status !== oldStatus) {
    await logBrandActivity({
      organizationId: req.organizationId,
      brandId: brand._id,
      actorId: req.user._id,
      action: `Status Changed: ${oldStatus} → ${data.status}`,
      metadata: { from: oldStatus, to: data.status },
    });
  }
  return brand;
}
export async function archiveBrand(req, brandId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await archiveWithinOrganization(
    brandId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!brand) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${brand.title}`, 'brands', brand._id);
  return brand;
}
export async function duplicateBrand(req, brandId) {
  const original = await getBrandById(req, brandId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  const copyTitle = `${original.title} (copy)`;
  data.title = copyTitle;
  data.name = copyTitle;
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Duplicated ${original.title}`, 'brands', copy._id);
  return copy;
}
export async function restoreBrand(req, brandId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await restoreWithinOrganization(
    brandId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!brand) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${brand.title}`, 'brands', brand._id);
  return brand;
}
export async function getBrandAnalytics(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const baseFilter = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };
  const [brands, followUpsDueCount] = await Promise.all([
    Brand.find(baseFilter).select('status source priority').lean(),
    Communication.countDocuments({
      $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
      nextFollowUp: { $ne: null, $lte: new Date() },
    }),
  ]);
  const totalBrands = brands.length;
  const wonDeals = brands.filter((b) =>
    ['Won', 'Completed', 'Contract Signed'].includes(b.status),
  ).length;
  const lostDeals = brands.filter((b) => b.status === 'Lost').length;
  const activeBrands = brands.filter(
    (b) => !['Lost', 'Archived', 'Paused'].includes(b.status),
  ).length;
  const conversionDenominator = wonDeals + lostDeals;
  const conversionRate =
    conversionDenominator > 0
      ? Number(((wonDeals / conversionDenominator) * 100).toFixed(1))
      : totalBrands > 0
      ? Number(((wonDeals / totalBrands) * 100).toFixed(1))
      : 0;
  const byStatus = {};
  const bySource = {};
  const byPriority = {};
  for (const b of brands) {
    byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    if (b.source) bySource[b.source] = (bySource[b.source] || 0) + 1;
    if (b.priority) byPriority[b.priority] = (byPriority[b.priority] || 0) + 1;
  }
  return {
    totalBrands,
    activeBrands,
    wonDeals,
    lostDeals,
    conversionRate,
    followUpsDue: followUpsDueCount,
    byStatus,
    bySource,
    byPriority,
  };
}
