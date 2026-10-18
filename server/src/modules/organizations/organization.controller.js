import {
  createOrganizationSchema,
  organizationIdSchema,
} from './organization.validation.js';
import * as service from './organization.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listUserOrganizations(req.user, req.session);
  ok(res, data);
}
export async function current(req, res) {
  const data = await service.getCurrentOrganization(req.user, req.session);
  ok(res, data);
}
export async function create(req, res) {
  const payload = createOrganizationSchema.parse(req.body);
  const { organization } = await service.createOrganization(req.user, payload, req.session);
  ok(res, organization, 'Organization created successfully.', 201);
}
export async function switchWorkspace(req, res) {
  const organizationId = organizationIdSchema.parse(req.params.id);
  const data = await service.switchOrganization(req.user, organizationId, req.session);
  ok(res, data, 'Switched active organization.');
}
export async function updateCurrent(req, res) {
  const { updateOrganizationSchema } = await import('./organization.validation.js');
  const payload = updateOrganizationSchema.parse(req.body);
  const organization = await service.updateCurrentOrganization(req.user, payload, req.session);
  ok(res, organization, 'Organization updated successfully.');
}
