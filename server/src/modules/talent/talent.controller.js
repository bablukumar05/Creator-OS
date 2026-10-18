import { talentIdSchema, talentPayloadSchema } from './talent.validation.js';
import * as service from './talent.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  ok(res, await service.listTalentRoster(req));
}
export async function detail(req, res) {
  const id = talentIdSchema.parse(req.params.id);
  ok(res, await service.getTalentById(req, id));
}
export async function create(req, res) {
  const payload = talentPayloadSchema.parse(req.body);
  const item = await service.addTalentToRoster(req, payload);
  ok(res, item, 'Creator added to talent roster.', 201);
}
export async function update(req, res) {
  const id = talentIdSchema.parse(req.params.id);
  const payload = talentPayloadSchema.partial().parse(req.body);
  const item = await service.updateTalentRoster(req, id, payload);
  ok(res, item, 'Talent entry updated.');
}
export async function remove(req, res) {
  const id = talentIdSchema.parse(req.params.id);
  await service.removeTalentFromRoster(req, id);
  ok(res, null, 'Talent entry removed.');
}
