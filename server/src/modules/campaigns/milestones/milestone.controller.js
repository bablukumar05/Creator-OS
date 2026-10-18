import * as service from './milestone.service.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listMilestones(req, req.params.campaignId);
  ok(res, data);
}
export async function create(req, res) {
  const data = await service.createMilestone(req, req.params.campaignId, req.body);
  ok(res, data, 'Milestone created successfully.', 201);
}
export async function update(req, res) {
  const data = await service.updateMilestone(req, req.params.campaignId, req.params.milestoneId, req.body);
  ok(res, data, 'Milestone updated successfully.');
}
export async function remove(req, res) {
  const data = await service.deleteMilestone(req, req.params.campaignId, req.params.milestoneId);
  ok(res, data);
}
