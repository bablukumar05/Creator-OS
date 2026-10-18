import { campaignIdSchema, parseCampaignPayload } from './campaign.validation.js';
import * as service from './campaign.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listCampaigns(req);
  ok(res, data);
}
export async function analytics(req, res) {
  const data = await service.getCampaignAnalytics(req);
  ok(res, data);
}
export async function detail(req, res) {
  const campaignId = campaignIdSchema.parse(req.params.id);
  const campaign = await service.getCampaignById(req, campaignId);
  ok(res, campaign);
}
export async function related(req, res) {
  const campaignId = campaignIdSchema.parse(req.params.id);
  const items = await service.getCampaignRelatedRecords(req, campaignId);
  ok(res, items);
}
export async function create(req, res) {
  const payload = parseCampaignPayload(req.body, false);
  const campaign = await service.createCampaign(req, payload);
  ok(res, campaign, 'Created successfully.', 201);
}
export async function update(req, res) {
  const campaignId = campaignIdSchema.parse(req.params.id);
  const payload = parseCampaignPayload(req.body, true);
  const campaign = await service.updateCampaign(req, campaignId, payload, req.body);
  ok(res, campaign, 'Changes saved.');
}
export async function remove(req, res) {
  const campaignId = campaignIdSchema.parse(req.params.id);
  await service.archiveCampaign(req, campaignId);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const campaignId = campaignIdSchema.parse(req.params.id);
  const copy = await service.duplicateCampaign(req, campaignId);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const campaignId = campaignIdSchema.parse(req.params.id);
  const restored = await service.restoreCampaign(req, campaignId);
  ok(res, restored, 'Record restored.');
}
