import mongoose from 'mongoose';
import { z } from 'zod';
export const briefIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const baseBriefFields = {
  title: z.string().trim().min(1, 'Title is required').max(500),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
  content: objectIdReferenceSchema.optional(),
  contentId: objectIdReferenceSchema.optional(),
  objective: z.string().trim().max(5000).optional(),
  audience: z.string().trim().max(2000).optional(),
  keyMessage: z.string().trim().max(5000).optional(),
  deliverables: z.string().trim().max(5000).optional(),
  references: z.array(z.string().url('Must be valid URL')).max(20).optional(),
};
const strictBriefObject = z.object(baseBriefFields).strict();
export function parseBriefPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(([field, value]) => (value !== '' && value !== null) || field === 'title'),
  );
  return (partial ? strictBriefObject.partial() : strictBriefObject).parse(cleaned);
}
