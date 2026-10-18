import * as service from './document.service.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listDocuments(req);
  ok(res, data);
}
export async function upload(req, res) {
  const data = await service.uploadDocument(req, req.body);
  ok(res, data, 'Document uploaded successfully.', 201);
}
export async function remove(req, res) {
  const data = await service.deleteDocument(req, req.params.id);
  ok(res, data);
}
