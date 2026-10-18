import { dealIdSchema, parseDealPayload } from './deal.validation.js';
import * as service from './deal.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listDeals(req);
  ok(res, data);
}
export async function detail(req, res) {
  const dealId = dealIdSchema.parse(req.params.id);
  const deal = await service.getDealById(req, dealId);
  ok(res, deal);
}
export async function related(req, res) {
  const dealId = dealIdSchema.parse(req.params.id);
  await service.getDealById(req, dealId);
  ok(res, []);
}
export async function create(req, res) {
  const payload = parseDealPayload(req.body, false);
  const deal = await service.createDeal(req, payload);
  ok(res, deal, 'Created successfully.', 201);
}
export async function update(req, res) {
  const dealId = dealIdSchema.parse(req.params.id);
  const payload = parseDealPayload(req.body, true);
  const deal = await service.updateDeal(req, dealId, payload, req.body);
  ok(res, deal, 'Changes saved.');
}
export async function remove(req, res) {
  const dealId = dealIdSchema.parse(req.params.id);
  await service.archiveDeal(req, dealId);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const dealId = dealIdSchema.parse(req.params.id);
  const copy = await service.duplicateDeal(req, dealId);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const dealId = dealIdSchema.parse(req.params.id);
  const restored = await service.restoreDeal(req, dealId);
  ok(res, restored, 'Record restored.');
}
