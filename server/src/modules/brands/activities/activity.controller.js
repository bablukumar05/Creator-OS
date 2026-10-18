import * as service from './activity.service.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listBrandActivities(req, req.params.brandId);
  ok(res, data);
}
