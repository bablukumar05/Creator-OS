import * as service from './deliverable.service.js';
import { createDeliverableSchema, updateDeliverableSchema } from './deliverable.validation.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listDeliverables(req);
  ok(res, data);
}
export async function overdue(req, res) {
  const data = await service.getOverdueDeliverables(req);
  ok(res, data);
}
export async function detail(req, res) {
  const data = await service.getDeliverableById(req, req.params.id);
  ok(res, data);
}
export async function create(req, res) {
  const payload = createDeliverableSchema.parse({
    ...req.body,
    campaignId: req.params.campaignId || req.body.campaignId,
  });
  const data = await service.createDeliverable(req, payload);
  ok(res, data, 'Deliverable created successfully.', 201);
}
export async function update(req, res) {
  const payload = updateDeliverableSchema.parse(req.body);
  const data = await service.updateDeliverable(req, req.params.id, payload);
  ok(res, data, 'Deliverable updated successfully.');
}
export async function remove(req, res) {
  const data = await service.deleteDeliverable(req, req.params.id);
  ok(res, data);
}
