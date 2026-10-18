import { CreatorProfile, RateCard, SocialAccount } from '../creators/creator.model.js';
import {
  CampaignCreator,
  CampaignInvitation,
  CampaignOffer,
  CreatorReview,
} from './marketplace.model.js';
import { findByIdWithinOrganization as findCampaignById } from '../campaigns/campaign.repository.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
export async function discoverCreators(req) {
  const criteria = { isPublic: true, deletedAt: null };
  if (req.query.search) {
    const term = escapeRegex(String(req.query.search).slice(0, 100));
    criteria.$or = [{ displayName: { $regex: term, $options: 'i' } }, { username: { $regex: term, $options: 'i' } }];
  }
  if (req.query.category) criteria.categories = { $in: [req.query.category] };
  if (req.query.niche) criteria.niches = { $in: [req.query.niche] };
  if (req.query.platform) criteria.platforms = { $in: [req.query.platform] };
  if (req.query.country) criteria.country = req.query.country;
  if (req.query.availability) criteria.availabilityStatus = req.query.availability;
  if (req.query.verified === 'true') criteria.isVerified = true;
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 12));
  const items = await CreatorProfile.find(criteria)
    .sort({ rating: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const total = await CreatorProfile.countDocuments(criteria);
  const populatedItems = await Promise.all(
    items.map(async (creator) => {
      const [socials, rateCard] = await Promise.all([
        SocialAccount.find({ creatorId: creator._id }).lean(),
        RateCard.findOne({ creatorId: creator._id }).lean(),
      ]);
      return { ...creator, socials, rateCard };
    }),
  );
  return { items: populatedItems, total, page, pages: Math.ceil(total / limit), limit };
}
export async function matchCreatorsForCampaign(req, campaignId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await findCampaignById(campaignId, req.organizationId, ownerId, { lean: true });
  if (!campaign) throw new ApiError(404, 'Campaign not found.');
  const candidates = await CreatorProfile.find({ isPublic: true, deletedAt: null }).lean();
  const matched = await Promise.all(
    candidates.map(async (creator) => {
      let score = 50;
      const reasons = [];
      if (campaign.category && creator.categories?.includes(campaign.category)) {
        score += 25;
        reasons.push(`Direct category match for ${campaign.category}`);
      } else {
        score += 15;
      }
      if (campaign.platform && creator.platforms?.includes(campaign.platform)) {
        score += 20;
        reasons.push(`Active on campaign target platform (${campaign.platform})`);
      }
      if (creator.rating >= 4.5) {
        score += 15;
        reasons.push(`High client rating (${creator.rating}★) and 95%+ completion rate`);
      } else {
        score += 10;
      }
      if (creator.availabilityStatus === 'Available') {
        score += 10;
        reasons.push('Creator is currently available for hire');
      }
      if (campaign.budget && creator.minimumBudget <= campaign.budget) {
        score += 15;
        reasons.push('Minimum rates fit within campaign budget');
      } else {
        score += 5;
      }
      const socials = await SocialAccount.find({ creatorId: creator._id }).lean();
      const maxEngagement = Math.max(0, ...socials.map((s) => s.engagementRate || 0));
      if (maxEngagement >= 3.0) {
        score += 15;
        reasons.push(`Strong audience engagement rate (${maxEngagement.toFixed(1)}%)`);
      } else {
        score += 5;
      }
      const finalScore = Math.min(100, score);
      return { creator: { ...creator, socials }, score: finalScore, reasons };
    }),
  );
  matched.sort((a, b) => b.score - a.score);
  return { campaignId: campaign._id, matches: matched.slice(0, 20) };
}
export async function createInvitation(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await findCampaignById(data.campaignId, req.organizationId, ownerId, { lean: true });
  if (!campaign) throw new ApiError(400, 'Select a valid campaign from your workspace.');
  const creator = await CreatorProfile.findById(data.creatorId);
  if (!creator) throw new ApiError(400, 'Select a valid creator.');
  const invitation = await CampaignInvitation.create({
    ...data,
    organizationId: req.organizationId,
    campaignId: campaign._id,
    creatorId: creator._id,
  });
  await recordActivity(req, `Invited ${creator.displayName} to Campaign`, 'campaigns', campaign._id);
  return invitation;
}
export async function listInvitations(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const myProfile = await CreatorProfile.findOne({ userId: req.user._id, deletedAt: null });
  const criteria = {
    $or: [
      { organizationId: req.organizationId },
      { owner: ownerId },
      ...(myProfile ? [{ creatorId: myProfile._id }] : []),
    ],
  };
  const items = await CampaignInvitation.find(criteria)
    .sort({ createdAt: -1 })
    .populate('campaignId', 'name title budget platform')
    .populate('creatorId', 'displayName username profileImage')
    .lean();
  return { items, total: items.length };
}
export async function createOffer(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const campaign = await findCampaignById(data.campaignId, req.organizationId, ownerId, { lean: true });
  if (!campaign) throw new ApiError(400, 'Select a valid campaign.');
  const offer = await CampaignOffer.create({
    ...data,
    senderId: req.user._id,
    status: 'Sent',
  });
  return offer;
}
export async function acceptOffer(req, offerId) {
  const offer = await CampaignOffer.findById(offerId);
  if (!offer) throw new ApiError(404, 'Offer not found.');
  offer.status = 'Accepted';
  await offer.save();
  const assignment = await CampaignCreator.findOneAndUpdate(
    { campaignId: offer.campaignId, creatorId: offer.creatorId },
    {
      organizationId: req.organizationId || offer.organizationId,
      campaignId: offer.campaignId,
      creatorId: offer.creatorId,
      agreedAmount: offer.amount,
      deliverables: offer.deliverables,
      status: 'Assigned',
    },
    { upsert: true, new: true },
  );
  return { offer, assignment };
}
export async function createCreatorReview(req, data) {
  const review = await CreatorReview.create({
    ...data,
    organizationId: req.organizationId,
    reviewerId: req.user._id,
  });
  const reviews = await CreatorReview.find({ creatorId: data.creatorId });
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await CreatorProfile.updateOne(
      { _id: data.creatorId },
      { $set: { rating: Number(avgRating.toFixed(1)) } },
    );
  }
  return review;
}
