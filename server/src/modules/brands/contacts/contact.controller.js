import * as service from './contact.service.js';
import { createContactSchema, updateContactSchema } from './contact.validation.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listContacts(req);
  ok(res, data);
}
export async function detail(req, res) {
  const data = await service.getContactById(req, req.params.id);
  ok(res, data);
}
export async function create(req, res) {
  const payload = createContactSchema.parse({
    ...req.body,
    brandId: req.params.brandId || req.body.brandId,
  });
  const data = await service.createContact(req, payload);
  ok(res, data, 'Contact created successfully.', 201);
}
export async function update(req, res) {
  const payload = updateContactSchema.parse(req.body);
  const data = await service.updateContact(req, req.params.id, payload);
  ok(res, data, 'Contact updated successfully.');
}
export async function remove(req, res) {
  const data = await service.deleteContact(req, req.params.id);
  ok(res, data);
}
