import {
  acceptInviteSchema,
  inviteMemberSchema,
  memberIdSchema,
  updateMemberSchema,
} from './member.validation.js';
import * as service from './member.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listOrganizationMembers(req.organizationId);
  ok(res, data);
}
export async function invite(req, res) {
  const payload = inviteMemberSchema.parse(req.body);
  const data = await service.inviteMember(req.organization, req.user, payload);
  ok(res, data, 'Member invitation created.', 201);
}
export async function acceptInvite(req, res) {
  const { token } = acceptInviteSchema.parse(req.body);
  const data = await service.acceptInvitation(req.user, token, req.session);
  ok(res, data, 'Invitation accepted. Joined organization.');
}
export async function update(req, res) {
  const memberId = memberIdSchema.parse(req.params.id);
  const updates = updateMemberSchema.parse(req.body);
  const member = await service.updateOrganizationMember(req.organizationId, memberId, updates);
  ok(res, member, 'Member updated.');
}
export async function remove(req, res) {
  const memberId = memberIdSchema.parse(req.params.id);
  await service.removeOrganizationMember(req.organizationId, memberId);
  ok(res, null, 'Member removed from organization.');
}
