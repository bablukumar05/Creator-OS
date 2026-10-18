import mongoose from 'mongoose';
import { z } from 'zod';
import { platforms } from '../../../../shared/resources.js';
export const publishingIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const basePublishingFields = {
  content: objectIdReferenceSchema.optional(),
  contentId: objectIdReferenceSchema.optional(),
  platform: z.enum(platforms).optional(),
  publishDate: z.iso.date('Invalid publish date'),
  publishedUrl: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
  status: z.enum(['Scheduled', 'Publishing', 'Published', 'Failed']).optional(),
  notes: z.string().trim().max(2000).optional(),
};
const strictPublishingObject = z.object(basePublishingFields).strict();
export function parsePublishingPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(([field, value]) => (value !== '' && value !== null) || field === 'publishDate'),
  );
  return (partial ? strictPublishingObject.partial() : strictPublishingObject).parse(cleaned);
}
