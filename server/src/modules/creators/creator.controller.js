import {
  creatorProfilePayloadSchema,
  inboundInquiryPayloadSchema,
  rateCardPayloadSchema,
  socialAccountPayloadSchema,
} from './creator.validation.js';
import * as service from './creator.service.js';
import { ok } from '../../../utils/http.js';
export async function getProfile(req, res) {
  ok(res, await service.getMyCreatorProfile(req));
}
export async function updateProfile(req, res) {
  const payload = creatorProfilePayloadSchema.parse(req.body);
  const updated = await service.updateMyCreatorProfile(req, payload);
  ok(res, updated, 'Creator profile updated.');
}
export async function upsertSocial(req, res) {
  const payload = socialAccountPayloadSchema.parse(req.body);
  const account = await service.upsertSocialAccount(req, payload);
  ok(res, account, 'Social account updated.');
}
export async function upsertRates(req, res) {
  const payload = rateCardPayloadSchema.parse(req.body);
  const rateCard = await service.upsertRateCard(req, payload);
  ok(res, rateCard, 'Rate card updated.');
}
export async function getPublicByUsername(req, res) {
  const { username } = req.params;
  ok(res, await service.getPublicCreatorByUsername(req, username));
}
export async function submitInquiry(req, res) {
  const { username } = req.params;
  const payload = inboundInquiryPayloadSchema.parse(req.body);
  const result = await service.submitInboundInquiry(req, username, payload);
  ok(res, result, 'Inquiry submitted successfully.');
}
