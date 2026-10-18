import mongoose from 'mongoose';
import { z } from 'zod';
import { platforms } from '../../../../shared/resources.js';
import { CONTENT_STATUSES, CONTENT_TYPES } from './content.constants.js';
import { normalizeContentPayload } from './content.types.js';
export const contentIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const httpUrlSchema = z
  .string()
  .trim()
  .refine((v) => !v || /^https?:\/\/[^\s]+$/.test(v), 'Must be a valid HTTP(S) URL')
  .optional()
  .or(z.literal(''));
const baseContentFields = {
  title: z.string().trim().min(1, 'This field is required').max(500),
  description: z.string().trim().max(10000).optional(),
  platform: z.enum(platforms).optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  contentType: z.enum(CONTENT_TYPES).optional(),
  status: z.enum(CONTENT_STATUSES).optional(),
  publishDate: z.iso.date().optional(),
  dueDate: z.iso.date().optional(),
  publishedAt: z.iso.date().optional(),
  scheduledTime: z.string().trim().max(500).optional(),
  category: z.string().trim().max(500).optional(),
  hashtags: z.string().trim().max(500).optional(),
  caption: z.string().trim().max(10000).optional(),
  thumbnail: httpUrlSchema.optional(),
  media: objectIdReferenceSchema.optional(),
  assets: z.array(objectIdReferenceSchema).max(50).optional(),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
  assignedTo: objectIdReferenceSchema.optional(),
  views: z.coerce.number().min(0).max(1e12).optional(),
  likes: z.coerce.number().min(0).max(1e12).optional(),
  comments: z.coerce.number().min(0).max(1e12).optional(),
  shares: z.coerce.number().min(0).max(1e12).optional(),
  saves: z.coerce.number().min(0).max(1e12).optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictContentObject = z.object(baseContentFields).strict();
export function parseContentPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || field === 'title',
    ),
  );
  const parsed = (partial ? strictContentObject.partial() : strictContentObject).parse(cleaned);
  return normalizeContentPayload(parsed);
}
