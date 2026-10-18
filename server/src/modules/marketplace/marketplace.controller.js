import {
  creatorReviewPayloadSchema,
  invitationPayloadSchema,
  offerPayloadSchema,
} from './marketplace.validation.js';
import * as service from './marketplace.service.js';
import { ok } from '../../../utils/http.js';
export async function discover(req, res) {
  ok(res, await service.discoverCreators(req));
}
export async function matchCampaign(req, res) {
  const { campaignId } = req.params;
  ok(res, await service.matchCreatorsForCampaign(req, campaignId));
}
export async function createInvite(req, res) {
  const payload = invitationPayloadSchema.parse(req.body);
  const invitation = await service.createInvitation(req, payload);
  ok(res, invitation, 'Campaign invitation sent.', 201);
}
export async function listInvites(req, res) {
  ok(res, await service.listInvitations(req));
}
export async function createOfferHandler(req, res) {
  const payload = offerPayloadSchema.parse(req.body);
  const offer = await service.createOffer(req, payload);
  ok(res, offer, 'Offer sent.', 201);
}
export async function acceptOfferHandler(req, res) {
  const { offerId } = req.params;
  const result = await service.acceptOffer(req, offerId);
  ok(res, result, 'Offer accepted and creator assigned to campaign.');
}
export async function createReview(req, res) {
  const payload = creatorReviewPayloadSchema.parse(req.body);
  const review = await service.createCreatorReview(req, payload);
  ok(res, review, 'Creator review submitted.', 201);
}
