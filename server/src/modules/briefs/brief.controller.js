import { briefIdSchema, parseBriefPayload } from './brief.validation.js';
import * as service from './brief.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  ok(res, await service.listBriefs(req));
}
export async function detail(req, res) {
  const id = briefIdSchema.parse(req.params.id);
  ok(res, await service.getBriefById(req, id));
}
export async function create(req, res) {
  const payload = parseBriefPayload(req.body, false);
  const brief = await service.createBrief(req, payload);
  ok(res, brief, 'Brief created successfully.', 201);
}
export async function update(req, res) {
  const id = briefIdSchema.parse(req.params.id);
  const payload = parseBriefPayload(req.body, true);
  const brief = await service.updateBrief(req, id, payload);
  ok(res, brief, 'Brief updated.');
}
export async function remove(req, res) {
  const id = briefIdSchema.parse(req.params.id);
  await service.archiveBrief(req, id);
  ok(res, null, 'Brief archived.');
}
