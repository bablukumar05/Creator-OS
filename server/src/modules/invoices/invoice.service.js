import PDFDocument from 'pdfkit';
import { INVOICE_SORT_FIELDS } from './invoice.constants.js';
import {
  archiveWithinOrganization,
  createForOrganization,
  findAllByOrganization,
  findByIdWithinOrganization,
  restoreWithinOrganization,
} from './invoice.repository.js';
import { findByIdWithinOrganization as findBrandByIdWithinOrganization } from '../brands/brand.repository.js';
import { findByIdWithinOrganization as findCampaignByIdWithinOrganization } from '../campaigns/campaign.repository.js';
import { models, Profile } from '../../../models/resources.js';
import {
  invoiceNumber,
  invoiceTotals,
  recordActivity,
} from '../../../services/resourceService.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_FIELDS = [
  'brand',
  'brandId',
  'campaign',
  'campaignId',
  'clientEmail',
  'clientAddress',
  'date',
  'dueDate',
  'notes',
];
async function verifyInvoiceRelations(data, organizationId, ownerId) {
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
}
export async function listInvoices(req) {
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
  const sort = INVOICE_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
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
export async function getInvoiceById(req, invoiceId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const invoice = await findByIdWithinOrganization(invoiceId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!invoice) throw new ApiError(404, 'Record not found.');
  return invoice;
}
export async function createInvoice(req, data) {
  if (!data.items?.length) {
    throw new ApiError(400, 'Add at least one invoice line.');
  }
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyInvoiceRelations(data, req.organizationId, ownerId);
  Object.assign(data, invoiceTotals(data), { number: invoiceNumber() });
  const invoice = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Created ${invoice.title}`, 'invoices', invoice._id);
  return invoice;
}
export async function updateInvoice(req, invoiceId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const invoice = await findByIdWithinOrganization(invoiceId, req.organizationId, ownerId);
  if (!invoice) throw new ApiError(404, 'Record not found.');
  await verifyInvoiceRelations(data, req.organizationId, ownerId);
  Object.assign(invoice, data);
  invoice.updatedBy = req.user._id;
  for (const field of CLEARABLE_FIELDS) {
    if (rawBody[field] === '') {
      invoice.set(field, undefined);
      if (field === 'brand' || field === 'brandId') {
        invoice.set('brand', undefined);
        invoice.set('brandId', undefined);
      }
      if (field === 'campaign' || field === 'campaignId') {
        invoice.set('campaign', undefined);
        invoice.set('campaignId', undefined);
      }
    }
  }
  Object.assign(invoice, invoiceTotals(invoice));
  await invoice.save();
  await recordActivity(req, `Updated ${invoice.title}`, 'invoices', invoice._id);
  if (data.status === 'Paid') {
    const notification = await models.notifications.create({
      owner: ownerId,
      organizationId: req.organizationId || null,
      createdBy: req.user._id,
      title: `Invoice ${invoice.number} paid`,
      description: invoice.title,
      category: 'Invoice paid',
    });
    req.app.get('io')?.to(String(ownerId)).emit('notification', notification);
  }
  return invoice;
}
export async function archiveInvoice(req, invoiceId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const invoice = await archiveWithinOrganization(
    invoiceId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!invoice) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${invoice.title}`, 'invoices', invoice._id);
  return invoice;
}
export async function duplicateInvoice(req, invoiceId) {
  const original = await getInvoiceById(req, invoiceId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  data.title = `${original.title} (copy)`;
  data.number = invoiceNumber();
  data.status = 'Draft';
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Duplicated ${original.title}`, 'invoices', copy._id);
  return copy;
}
export async function restoreInvoice(req, invoiceId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const invoice = await restoreWithinOrganization(
    invoiceId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!invoice) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${invoice.title}`, 'invoices', invoice._id);
  return invoice;
}
export async function streamInvoicePdf(req, res, invoiceId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const invoice = await findByIdWithinOrganization(invoiceId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  const [brand, profile] = await Promise.all([
    invoice.brand
      ? findBrandByIdWithinOrganization(invoice.brand, req.organizationId, ownerId, { lean: true })
      : null,
    Profile.findOne({ owner: ownerId }).lean(),
  ]);
  const currency = req.organization?.settings?.currency || profile?.currency || 'INR';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);
  doc.fillColor('#254d3e').fontSize(26).text('CreatorOS').moveDown();
  doc.fillColor('#222').fontSize(30).text('INVOICE').fontSize(11).text(invoice.number).moveDown();
  doc
    .text(`From: ${req.user.name}`)
    .text(req.user.email)
    .moveDown()
    .text(`Bill to: ${brand?.title || invoice.title}`)
    .text(invoice.clientEmail || '')
    .text(invoice.clientAddress || '')
    .moveDown()
    .text(`Issued: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString('en-GB')}`)
    .text(
      `Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'On receipt'}`,
    )
    .text(`Status: ${invoice.status}`)
    .moveDown(2);
  for (const item of invoice.items || []) {
    if (doc.y > 680) doc.addPage();
    doc
      .fontSize(12)
      .text(item.description)
      .fontSize(10)
      .fillColor('#666')
      .text(
        `${item.quantity} x ${currency} ${item.rate.toFixed(2)} = ${currency} ${(item.quantity * item.rate).toFixed(2)}`,
      )
      .fillColor('#222')
      .moveDown();
  }
  if (doc.y > 620) doc.addPage();
  doc
    .moveDown()
    .text(`Subtotal: ${currency} ${(invoice.subtotal || 0).toFixed(2)}`, { align: 'right' })
    .text(`Discount: ${currency} ${(invoice.discount || 0).toFixed(2)}`, { align: 'right' })
    .text(`Tax: ${invoice.tax || 0}%`, { align: 'right' })
    .fontSize(18)
    .text(`Total: ${currency} ${(invoice.amount || 0).toFixed(2)}`, { align: 'right' })
    .moveDown()
    .fontSize(10)
    .text(invoice.notes || 'Thank you for your partnership.');
  doc.end();
}
