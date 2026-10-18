import { invoiceIdSchema, parseInvoicePayload } from './invoice.validation.js';
import * as service from './invoice.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listInvoices(req);
  ok(res, data);
}
export async function overdue(req, res) {
  const data = await service.getOverdueInvoices(req);
  ok(res, data);
}
export async function detail(req, res) {
  const invoiceId = invoiceIdSchema.parse(req.params.id);
  const invoice = await service.getInvoiceById(req, invoiceId);
  ok(res, invoice);
}
export async function related(req, res) {
  const invoiceId = invoiceIdSchema.parse(req.params.id);
  await service.getInvoiceById(req, invoiceId);
  ok(res, []);
}
export async function pdf(req, res) {
  const invoiceId = invoiceIdSchema.parse(req.params.id);
  await service.streamInvoicePdf(req, res, invoiceId);
}
export async function create(req, res) {
  const payload = parseInvoicePayload(req.body, false);
  const invoice = await service.createInvoice(req, payload);
  ok(res, invoice, 'Created successfully.', 201);
}
export async function update(req, res) {
  const invoiceId = invoiceIdSchema.parse(req.params.id);
  const payload = parseInvoicePayload(req.body, true);
  const invoice = await service.updateInvoice(req, invoiceId, payload, req.body);
  ok(res, invoice, 'Changes saved.');
}
export async function remove(req, res) {
  const invoiceId = invoiceIdSchema.parse(req.params.id);
  await service.archiveInvoice(req, invoiceId);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const invoiceId = invoiceIdSchema.parse(req.params.id);
  const copy = await service.duplicateInvoice(req, invoiceId);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const invoiceId = invoiceIdSchema.parse(req.params.id);
  const restored = await service.restoreInvoice(req, invoiceId);
  ok(res, restored, 'Record restored.');
}
