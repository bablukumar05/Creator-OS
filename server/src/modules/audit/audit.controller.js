import { listOrganizationAuditLogs } from './audit.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await listOrganizationAuditLogs(req.organizationId, req.query);
  ok(res, data);
}
