import * as service from './approval.service.js';
import { createApprovalSchema, reviewApprovalSchema } from './approval.validation.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listApprovals(req);
  ok(res, data);
}
export async function detail(req, res) {
  const data = await service.getApprovalById(req, req.params.id);
  ok(res, data);
}
export async function create(req, res) {
  const payload = createApprovalSchema.parse(req.body);
  const data = await service.createApproval(req, payload);
  ok(res, data, 'Submitted for approval.', 201);
}
export async function review(req, res) {
  const payload = reviewApprovalSchema.parse(req.body);
  const data = await service.reviewApproval(req, req.params.id, payload);
  ok(res, data, 'Approval reviewed successfully.');
}
