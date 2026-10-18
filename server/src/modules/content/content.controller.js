import { contentIdSchema, parseContentPayload } from './content.validation.js';
import * as service from './content.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listContent(req);
  ok(res, data);
}
export async function detail(req, res) {
  const contentId = contentIdSchema.parse(req.params.id);
  const content = await service.getContentById(req, contentId);
  ok(res, content);
}
export async function related(req, res) {
  const contentId = contentIdSchema.parse(req.params.id);
  const items = await service.getContentRelatedRecords(req, contentId);
  ok(res, items);
}
export async function create(req, res) {
  const payload = parseContentPayload(req.body, false);
  const content = await service.createContent(req, payload);
  ok(res, content, 'Created successfully.', 201);
}
export async function update(req, res) {
  const contentId = contentIdSchema.parse(req.params.id);
  const payload = parseContentPayload(req.body, true);
  const content = await service.updateContent(req, contentId, payload, req.body);
  ok(res, content, 'Changes saved.');
}
export async function remove(req, res) {
  const contentId = contentIdSchema.parse(req.params.id);
  await service.archiveContent(req, contentId);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const contentId = contentIdSchema.parse(req.params.id);
  const copy = await service.duplicateContent(req, contentId);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const contentId = contentIdSchema.parse(req.params.id);
  const restored = await service.restoreContent(req, contentId);
  ok(res, restored, 'Record restored.');
}
