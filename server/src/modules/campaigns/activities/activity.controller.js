import * as service from './activity.service.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listCampaignActivities(req, req.params.campaignId);
  ok(res, data);
}
