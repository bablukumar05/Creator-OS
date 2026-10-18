import { FINANCE_SORT_FIELDS } from './finance.constants.js';
import { Expense, Revenue } from './finance.model.js';
import {
  buildTenantFilter,
  expenseRepository,
  revenueRepository,
} from './finance.repository.js';
import { findByIdWithinOrganization as findBrandByIdWithinOrganization } from '../brands/brand.repository.js';
import { findByIdWithinOrganization as findCampaignByIdWithinOrganization } from '../campaigns/campaign.repository.js';
import { Invoice } from '../invoices/invoice.model.js';
import { models } from '../../../models/resources.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_REVENUE_FIELDS = [
  'date',
  'brand',
  'brandId',
  'campaign',
  'campaignId',
  'paymentMethod',
  'notes',
];
const CLEARABLE_EXPENSE_FIELDS = [
  'date',
  'campaign',
  'campaignId',
  'receipt',
  'notes',
];
async function verifyFinanceRelations(data, organizationId, ownerId) {
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
  const targetCampaignId = data.campaign || data.campaignId;
  if (targetCampaignId) {
    const campaign = await findCampaignByIdWithinOrganization(
      targetCampaignId,
      organizationId,
      ownerId,
      { lean: true },
    );
    if (!campaign) {
      throw new ApiError(400, 'Select a valid campaign from your workspace.');
    }
    data.campaign = campaign._id;
    data.campaignId = campaign._id;
  }
  if (data.receipt) {
    const mediaScopeFilter = organizationId
      ? { $or: [{ organizationId }, { organizationId: null, owner: ownerId }], deletedAt: null }
      : { owner: ownerId, deletedAt: null };
    const exists = await models.media.exists({ _id: data.receipt, ...mediaScopeFilter });
    if (!exists) {
      throw new ApiError(400, 'Select a valid receipt from your workspace.');
    }
  }
}
function buildFinanceListQuery(req) {
  const criteria = {};
  if (req.query.search) {
    criteria.title = {
      $regex: escapeRegex(String(req.query.search).slice(0, 100)),
      $options: 'i',
    };
  }
  if (req.query.status) criteria.status = String(req.query.status);
  if (req.query.platform) criteria.platform = String(req.query.platform);
  if (req.query.category) criteria.category = String(req.query.category);
  const brandFilter = req.query.brand || req.query.brandId;
  if (brandFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(brandFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.brand = String(brandFilter);
  }
  const campaignFilter = req.query.campaign || req.query.campaignId;
  if (campaignFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(campaignFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.campaign = String(campaignFilter);
  }
  if (req.query.receipt) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.receipt))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.receipt = String(req.query.receipt);
  }
  if (req.query.from || req.query.to) {
    criteria.date = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      if (!Number.isFinite(+from)) throw new ApiError(400, 'Invalid start date.');
      criteria.date.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (!Number.isFinite(+to)) throw new ApiError(400, 'Invalid end date.');
      criteria.date.$lte = to;
    }
  }
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
  const rawSort = String(req.query.sort || '-createdAt');
  const sortField = rawSort.replace(/^-/, '');
  const sort = FINANCE_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
  return {
    criteria,
    includeDeleted: req.query.archived === 'true',
    page,
    limit,
    sort,
  };
}
export async function listRevenue(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const { criteria, includeDeleted, page, limit, sort } = buildFinanceListQuery(req);
  const { items, total } = await revenueRepository.findAllByOrganization(
    req.organizationId,
    ownerId,
    criteria,
    {
      includeDeleted,
      sort,
      skip: (page - 1) * limit,
      limit,
    },
  );
  return { items, total, page, pages: Math.ceil(total / limit), limit };
}
export async function getRevenueById(req, revenueId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await revenueRepository.findByIdWithinOrganization(
    revenueId,
    req.organizationId,
    ownerId,
    { lean: true },
  );
  if (!record) throw new ApiError(404, 'Record not found.');
  return record;
}
export async function createRevenue(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyFinanceRelations(data, req.organizationId, ownerId);
  const record = await revenueRepository.createForOrganization(
    data,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  await recordActivity(req, `Created ${record.title}`, 'revenue', record._id);
  return record;
}
export async function updateRevenue(req, revenueId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await revenueRepository.findByIdWithinOrganization(
    revenueId,
    req.organizationId,
    ownerId,
  );
  if (!record) throw new ApiError(404, 'Record not found.');
  await verifyFinanceRelations(data, req.organizationId, ownerId);
  Object.assign(record, data);
  record.updatedBy = req.user._id;
  for (const field of CLEARABLE_REVENUE_FIELDS) {
    if (rawBody[field] === '') {
      record.set(field, undefined);
      if (field === 'brand' || field === 'brandId') {
        record.set('brand', undefined);
        record.set('brandId', undefined);
      }
      if (field === 'campaign' || field === 'campaignId') {
        record.set('campaign', undefined);
        record.set('campaignId', undefined);
      }
    }
  }
  await record.save();
  await recordActivity(req, `Updated ${record.title}`, 'revenue', record._id);
  return record;
}
export async function archiveRevenue(req, revenueId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await revenueRepository.archiveWithinOrganization(
    revenueId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!record) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${record.title}`, 'revenue', record._id);
  return record;
}
export async function duplicateRevenue(req, revenueId) {
  const original = await getRevenueById(req, revenueId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  data.title = `${original.title} (copy)`;
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await revenueRepository.createForOrganization(
    data,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  await recordActivity(req, `Duplicated ${original.title}`, 'revenue', copy._id);
  return copy;
}
export async function restoreRevenue(req, revenueId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await revenueRepository.restoreWithinOrganization(
    revenueId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!record) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${record.title}`, 'revenue', record._id);
  return record;
}
export async function listExpenses(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const { criteria, includeDeleted, page, limit, sort } = buildFinanceListQuery(req);
  const { items, total } = await expenseRepository.findAllByOrganization(
    req.organizationId,
    ownerId,
    criteria,
    {
      includeDeleted,
      sort,
      skip: (page - 1) * limit,
      limit,
    },
  );
  return { items, total, page, pages: Math.ceil(total / limit), limit };
}
export async function getExpenseById(req, expenseId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await expenseRepository.findByIdWithinOrganization(
    expenseId,
    req.organizationId,
    ownerId,
    { lean: true },
  );
  if (!record) throw new ApiError(404, 'Record not found.');
  return record;
}
export async function createExpense(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyFinanceRelations(data, req.organizationId, ownerId);
  const record = await expenseRepository.createForOrganization(
    data,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  await recordActivity(req, `Created ${record.title}`, 'expenses', record._id);
  return record;
}
export async function updateExpense(req, expenseId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await expenseRepository.findByIdWithinOrganization(
    expenseId,
    req.organizationId,
    ownerId,
  );
  if (!record) throw new ApiError(404, 'Record not found.');
  await verifyFinanceRelations(data, req.organizationId, ownerId);
  Object.assign(record, data);
  record.updatedBy = req.user._id;
  for (const field of CLEARABLE_EXPENSE_FIELDS) {
    if (rawBody[field] === '') {
      record.set(field, undefined);
      if (field === 'campaign' || field === 'campaignId') {
        record.set('campaign', undefined);
        record.set('campaignId', undefined);
      }
    }
  }
  await record.save();
  await recordActivity(req, `Updated ${record.title}`, 'expenses', record._id);
  return record;
}
export async function archiveExpense(req, expenseId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await expenseRepository.archiveWithinOrganization(
    expenseId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!record) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${record.title}`, 'expenses', record._id);
  return record;
}
export async function duplicateExpense(req, expenseId) {
  const original = await getExpenseById(req, expenseId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  data.title = `${original.title} (copy)`;
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await expenseRepository.createForOrganization(
    data,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  await recordActivity(req, `Duplicated ${original.title}`, 'expenses', copy._id);
  return copy;
}
export async function restoreExpense(req, expenseId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const record = await expenseRepository.restoreWithinOrganization(
    expenseId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!record) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${record.title}`, 'expenses', record._id);
  return record;
}
export async function getFinanceSummary(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const filter = buildTenantFilter(req.organizationId, ownerId, { includeDeleted: false });
  const [revenues, expenses, invoices] = await Promise.all([
    Revenue.find(filter).select('amount status category').lean(),
    Expense.find(filter).select('amount category').lean(),
    Invoice.find(filter).select('amount status').lean(),
  ]);
  const totalRevenue = revenues
    .filter((r) => r.status === 'Paid')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingRevenue = revenues
    .filter((r) => r.status !== 'Paid')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const unpaidInvoicesAmount = invoices
    .filter((i) => ['Draft', 'Sent', 'Overdue'].includes(i.status))
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  return {
    totalRevenue,
    pendingRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    unpaidInvoicesAmount,
    currency: req.organization?.settings?.currency || 'INR',
  };
}
