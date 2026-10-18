import {
  assetIdSchema,
  assetVersionPayloadSchema,
  confirmAssetPayloadSchema,
  parseAssetPayload,
  presignAssetPayloadSchema,
} from './asset.validation.js';
import * as service from './asset.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  ok(res, await service.listAssets(req));
}
export async function detail(req, res) {
  const id = assetIdSchema.parse(req.params.id);
  ok(res, await service.getAssetById(req, id));
}
export async function upload(req, res) {
  const payload = parseAssetPayload(req.body, false);
  const asset = await service.uploadAsset(req, payload);
  ok(res, asset, 'Asset uploaded successfully.', 201);
}
export async function presign(req, res) {
  const payload = presignAssetPayloadSchema.parse(req.body);
  const data = await service.getPresignedUpload(req, payload);
  ok(res, data, 'Presigned URL generated.');
}
export async function confirm(req, res) {
  const payload = confirmAssetPayloadSchema.parse(req.body);
  const asset = await service.confirmDirectUpload(req, payload);
  ok(res, asset, 'Cloud asset verified and stored.', 201);
}
export async function queueStatus(req, res) {
  const stats = await service.getQueueStatus();
  ok(res, stats);
}
export async function addVersion(req, res) {
  const id = assetIdSchema.parse(req.params.id);
  const versionPayload = assetVersionPayloadSchema.parse(req.body);
  const updatedAsset = await service.addAssetVersion(req, id, versionPayload);
  ok(res, updatedAsset, 'Asset version added successfully.', 201);
}
export async function remove(req, res) {
  const id = assetIdSchema.parse(req.params.id);
  await service.archiveAsset(req, id);
  ok(res, null, 'Asset archived.');
}
