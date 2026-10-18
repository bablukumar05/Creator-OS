import * as service from './communication.service.js';
import { createCommunicationSchema, updateCommunicationSchema } from './communication.validation.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listCommunications(req);
  ok(res, data);
}
export async function followUps(req, res) {
  const data = await service.getFollowUpsDue(req);
  ok(res, data);
}
export async function detail(req, res) {
  const data = await service.getCommunicationById(req, req.params.id);
  ok(res, data);
}
export async function create(req, res) {
  const payload = createCommunicationSchema.parse({
    ...req.body,
    brandId: req.params.brandId || req.body.brandId,
  });
  const data = await service.createCommunication(req, payload);
  ok(res, data, 'Communication logged successfully.', 201);
}
export async function update(req, res) {
  const payload = updateCommunicationSchema.parse(req.body);
  const data = await service.updateCommunication(req, req.params.id, payload);
  ok(res, data, 'Communication updated successfully.');
}
export async function remove(req, res) {
  const data = await service.deleteCommunication(req, req.params.id);
  ok(res, data);
}
