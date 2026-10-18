import { parsePublishingPayload, publishingIdSchema } from './publishing.validation.js';
import * as service from './publishing.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  ok(res, await service.listPublishing(req));
}
export async function calendar(req, res) {
  ok(res, await service.getCalendar(req));
}
export async function detail(req, res) {
  const id = publishingIdSchema.parse(req.params.id);
  ok(res, await service.getPublishingById(req, id));
}
export async function create(req, res) {
  const payload = parsePublishingPayload(req.body, false);
  const publishing = await service.createPublishing(req, payload);
  ok(res, publishing, 'Publishing scheduled successfully.', 201);
}
export async function update(req, res) {
  const id = publishingIdSchema.parse(req.params.id);
  const payload = parsePublishingPayload(req.body, true);
  const publishing = await service.updatePublishing(req, id, payload);
  ok(res, publishing, 'Publishing updated.');
}
