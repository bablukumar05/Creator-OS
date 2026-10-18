import { brandIdSchema, parseBrandPayload } from './brand.validation.js';
import * as service from './brand.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listBrands(req);
  ok(res, data);
}
export async function analytics(req, res) {
  const data = await service.getBrandAnalytics(req);
  ok(res, data);
}
export async function detail(req, res) {
  const brandId = brandIdSchema.parse(req.params.id);
  const brand = await service.getBrandById(req, brandId);
  ok(res, brand);
}
export async function related(req, res) {
  const brandId = brandIdSchema.parse(req.params.id);
  const items = await service.getBrandRelatedRecords(req, brandId);
  ok(res, items);
}
export async function create(req, res) {
  const payload = parseBrandPayload(req.body, false);
  const brand = await service.createBrand(req, payload);
  ok(res, brand, 'Created successfully.', 201);
}
export async function update(req, res) {
  const brandId = brandIdSchema.parse(req.params.id);
  const payload = parseBrandPayload(req.body, true);
  const brand = await service.updateBrand(req, brandId, payload, req.body);
  ok(res, brand, 'Changes saved.');
}
export async function remove(req, res) {
  const brandId = brandIdSchema.parse(req.params.id);
  await service.archiveBrand(req, brandId);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const brandId = brandIdSchema.parse(req.params.id);
  const copy = await service.duplicateBrand(req, brandId);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const brandId = brandIdSchema.parse(req.params.id);
  const restored = await service.restoreBrand(req, brandId);
  ok(res, restored, 'Record restored.');
}
