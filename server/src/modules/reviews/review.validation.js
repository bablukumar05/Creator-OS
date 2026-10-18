import mongoose from 'mongoose';
import { z } from 'zod';
export const reviewIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const baseReviewFields = {
  content: objectIdReferenceSchema.optional(),
  contentId: objectIdReferenceSchema.optional(),
  asset: objectIdReferenceSchema.optional(),
  assetId: objectIdReferenceSchema.optional(),
  timestamp: z.coerce.number().min(0).optional(),
  comment: z.string().trim().min(1, 'Comment is required').max(5000),
  status: z.enum(['Pending', 'Changes Requested', 'Approved', 'Resolved']).optional(),
};
const strictReviewObject = z.object(baseReviewFields).strict();
export function parseReviewPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(([field, value]) => (value !== '' && value !== null) || field === 'comment'),
  );
  return (partial ? strictReviewObject.partial() : strictReviewObject).parse(cleaned);
}
