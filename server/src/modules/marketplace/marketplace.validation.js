import mongoose from 'mongoose';
import { z } from 'zod';
export const marketplaceIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
export const invitationPayloadSchema = z
  .object({
    campaignId: objectIdReferenceSchema,
    creatorId: objectIdReferenceSchema,
    proposedBudget: z.coerce.number().min(0).optional(),
    deliverables: z.string().trim().max(5000).optional(),
    message: z.string().trim().max(5000).optional(),
    expiresAt: z.iso.date().optional(),
  })
  .strict();
export const applicationPayloadSchema = z
  .object({
    campaignId: objectIdReferenceSchema,
    proposal: z.string().trim().min(1, 'Proposal is required').max(5000),
    proposedPrice: z.coerce.number().min(0),
    portfolio: z.array(z.string().url()).optional(),
  })
  .strict();
export const offerPayloadSchema = z
  .object({
    campaignId: objectIdReferenceSchema,
    creatorId: objectIdReferenceSchema,
    amount: z.coerce.number().min(0),
    currency: z.string().trim().max(10).optional(),
    deliverables: z.string().trim().max(5000).optional(),
    expiryDate: z.iso.date().optional(),
  })
  .strict();
export const creatorReviewPayloadSchema = z
  .object({
    campaignId: objectIdReferenceSchema,
    creatorId: objectIdReferenceSchema,
    brandId: objectIdReferenceSchema.optional(),
    rating: z.coerce.number().min(1).max(5),
    contentQualityScore: z.coerce.number().min(1).max(5).optional(),
    communicationScore: z.coerce.number().min(1).max(5).optional(),
    timelinessScore: z.coerce.number().min(1).max(5).optional(),
    reviewText: z.string().trim().max(5000).optional(),
  })
  .strict();
