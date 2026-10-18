import { parseReviewPayload, reviewIdSchema } from './review.validation.js';
import * as service from './review.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  ok(res, await service.listReviews(req));
}
export async function detail(req, res) {
  const id = reviewIdSchema.parse(req.params.id);
  ok(res, await service.getReviewById(req, id));
}
export async function create(req, res) {
  const payload = parseReviewPayload(req.body, false);
  const review = await service.createReview(req, payload);
  ok(res, review, 'Review comment added.', 201);
}
export async function update(req, res) {
  const id = reviewIdSchema.parse(req.params.id);
  const payload = parseReviewPayload(req.body, true);
  const review = await service.updateReview(req, id, payload);
  ok(res, review, 'Review updated.');
}
export async function remove(req, res) {
  const id = reviewIdSchema.parse(req.params.id);
  await service.archiveReview(req, id);
  ok(res, null, 'Review removed.');
}
export async function toggleResolve(req, res) {
  const id = reviewIdSchema.parse(req.params.id);
  const review = await service.toggleResolveReview(req, id);
  ok(res, review, 'Review status updated.');
}
