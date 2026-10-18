import mongoose from 'mongoose';
import { z } from 'zod';
import {
  CONTENT_TYPES,
  DELIVERABLE_PLATFORMS,
  DELIVERABLE_STATUSES,
} from '../campaign.constants.js';
const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
export const createDeliverableSchema = z
  .object({
    campaignId: objectIdSchema,
    creatorId: objectIdSchema.optional().nullable(),
    title: z.string().trim().min(1, 'Title is required').max(300),
    platform: z.enum(DELIVERABLE_PLATFORMS).optional(),
    contentType: z.enum(CONTENT_TYPES).optional(),
    quantity: z.coerce.number().min(1).optional(),
    dueDate: z.iso.date().optional(),
    status: z.enum(DELIVERABLE_STATUSES).optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .strict();
export const updateDeliverableSchema = createDeliverableSchema
  .partial()
  .omit({ campaignId: true })
  .strict();
