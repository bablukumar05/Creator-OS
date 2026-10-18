import mongoose from 'mongoose';
import { z } from 'zod';
import { APPROVAL_STATUSES } from '../campaign.constants.js';
const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
export const createApprovalSchema = z
  .object({
    campaignId: objectIdSchema,
    deliverableId: objectIdSchema,
    reviewerId: objectIdSchema.optional().nullable(),
    comments: z.string().trim().max(5000).optional(),
  })
  .strict();
export const reviewApprovalSchema = z
  .object({
    status: z.enum(APPROVAL_STATUSES),
    comments: z.string().trim().max(5000).optional(),
  })
  .strict();
