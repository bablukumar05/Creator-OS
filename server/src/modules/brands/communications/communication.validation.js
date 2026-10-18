import mongoose from 'mongoose';
import { z } from 'zod';
import { COMMUNICATION_TYPES } from '../brand.constants.js';
const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
export const createCommunicationSchema = z
  .object({
    brandId: objectIdSchema,
    contactId: objectIdSchema.optional().nullable(),
    type: z.enum(COMMUNICATION_TYPES).optional(),
    subject: z.string().trim().min(1, 'Subject is required').max(300),
    summary: z.string().trim().min(1, 'Summary is required').max(10000),
    date: z.iso.date().optional(),
    nextFollowUp: z.iso.date().optional().nullable(),
  })
  .strict();
export const updateCommunicationSchema = createCommunicationSchema
  .partial()
  .omit({ brandId: true })
  .strict();
