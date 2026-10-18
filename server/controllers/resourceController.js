import { models } from '../models/resources.js';
import { resources } from '../../shared/resources.js';
import { parseResource } from '../validations/resources.js';
import { ApiError, ok, escapeRegex } from '../utils/http.js';
import { tenantScope } from '../src/middleware/organization.middleware.js';
import {
  validateRelations,
  invoiceTotals,
  invoiceNumber,
  recordActivity,
} from '../services/resourceService.js';
export const scoped = (req) => tenantScope(req);
export function queryFilter(req, key) {
  const filter = tenantScope(req, { includeDeleted: req.query.archived === 'true' });
  const fields = resources[key].fields.map((f) => f.key);
  if (req.query.search)
    filter.title = { $regex: escapeRegex(String(req.query.search).slice(0, 100)), $options: 'i' };
  for (const name of ['status', 'platform', 'category', 'priority'])
    if (req.query[name] && fields.includes(name)) filter[name] = String(req.query[name]);
  for (const f of resources[key].fields.filter((f) => f.type === 'relation'))
    if (req.query[f.key]) {
      if (!/^[a-f\d]{24}$/i.test(String(req.query[f.key])))
        throw new ApiError(400, 'Invalid relationship filter.');
      filter[f.key] = String(req.query[f.key]);
    }
  const dateField = fields.includes('publishDate')
    ? 'publishDate'
    : fields.includes('date')
      ? 'date'
      : fields.includes('dueDate')
        ? 'dueDate'
        : 'createdAt';
  if (req.query.from || req.query.to) {
    filter[dateField] = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      if (!Number.isFinite(+from)) throw new ApiError(400, 'Invalid start date.');
      filter[dateField].$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (!Number.isFinite(+to)) throw new ApiError(400, 'Invalid end date.');
      filter[dateField].$lte = to;
    }
  }
  return filter;
}
export async function list(req, res) {
  const key = req.resource;
  const filter = queryFilter(req, key);
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
  const allowed = [
    'createdAt',
    'title',
    'amount',
    'status',
    'dueDate',
    'date',
    'publishDate',
    'deadline',
  ];
  const sort = String(req.query.sort || '-createdAt');
  const [items, total] = await Promise.all([
    models[key]
      .find(filter)
      .sort(allowed.includes(sort.replace(/^-/, '')) ? sort : '-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    models[key].countDocuments(filter),
  ]);
  ok(res, { items, total, page, pages: Math.ceil(total / limit), limit });
}
export async function detail(req, res) {
  const record = await models[req.resource].findOne({ ...scoped(req), _id: req.params.id }).lean();
  if (!record) throw new ApiError(404, 'Record not found.');
  ok(res, record);
}
export async function related(req, res) {
  const record = await models[req.resource]
    .findOne({ ...scoped(req), _id: req.params.id })
    .lean();
  if (!record) throw new ApiError(404, 'Record not found.');
  const relation =
    req.resource === 'brands' ? 'brand' : req.resource === 'campaigns' ? 'campaign' : null;
  if (!relation) return ok(res, []);
  const groups = await Promise.all(
    Object.entries(resources)
      .filter(([, config]) => config.fields.some((f) => f.key === relation))
      .map(async ([key, config]) => {
        const filter = { ...scoped(req), [relation]: record._id };
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
  ok(
    res,
    groups.filter((group) => group.total),
  );
}
export async function create(req, res) {
  const key = req.resource;
  if (key === 'media') throw new ApiError(400, 'Use media upload to add an asset.');
  const data = parseResource(key, req.body);
  const ownerId = req.organization?.ownerId || req.user._id;
  await validateRelations(key, data, ownerId, req.organizationId);
  if (key === 'invoices') {
    if (!data.items?.length) throw new ApiError(400, 'Add at least one invoice line.');
    Object.assign(data, invoiceTotals(data), { number: invoiceNumber() });
  }
  const record = await models[key].create({
    ...data,
    owner: ownerId,
    organizationId: req.organizationId || null,
    createdBy: req.user._id,
  });
  await recordActivity(req, `Created ${record.title}`, key, record._id);
  ok(res, record, 'Created successfully.', 201);
}
export async function update(req, res) {
  const key = req.resource;
  const record = await models[key].findOne({ ...scoped(req), _id: req.params.id });
  if (!record) throw new ApiError(404, 'Record not found.');
  const data = parseResource(key, req.body, true);
  const ownerId = req.organization?.ownerId || req.user._id;
  await validateRelations(key, data, ownerId, req.organizationId);
  Object.assign(record, data);
  for (const field of resources[key].fields)
    if (!field.required && !field.options && req.body[field.key] === '')
      record.set(field.key, undefined);
  if (key === 'invoices') Object.assign(record, invoiceTotals(record));
  await record.save();
  await recordActivity(req, `Updated ${record.title}`, key, record._id);
  if (key === 'invoices' && data.status === 'Paid') {
    const notification = await models.notifications.create({
      owner: ownerId,
      organizationId: req.organizationId || null,
      createdBy: req.user._id,
      title: `Invoice ${record.number} paid`,
      description: record.title,
      category: 'Invoice paid',
    });
    req.app.get('io')?.to(String(ownerId)).emit('notification', notification);
  }
  ok(res, record, 'Changes saved.');
}
export async function remove(req, res) {
  const record = await models[req.resource].findOneAndUpdate(
    { ...scoped(req), _id: req.params.id },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
  if (!record) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${record.title}`, req.resource, record._id);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const key = req.resource;
  if (['media', 'notifications'].includes(key))
    throw new ApiError(400, 'This resource cannot be duplicated.');
  const record = await models[key].findOne({ ...scoped(req), _id: req.params.id }).lean();
  if (!record) throw new ApiError(404, 'Record not found.');
  const { _id, createdAt, updatedAt, __v, ...data } = record;
  data.title += ' (copy)';
  data.organizationId = req.organizationId || data.organizationId || null;
  data.createdBy = req.user._id;
  if (key === 'invoices') {
    data.number = invoiceNumber();
    data.status = 'Draft';
  }
  const copy = await models[key].create(data);
  await recordActivity(req, `Duplicated ${record.title}`, key, copy._id);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const record = await models[req.resource].findOneAndUpdate(
    { ...tenantScope(req, { includeDeleted: true }), _id: req.params.id },
    { $set: { deletedAt: null } },
    { new: true },
  );
  if (!record) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${record.title}`, req.resource, record._id);
  ok(res, record, 'Record restored.');
}