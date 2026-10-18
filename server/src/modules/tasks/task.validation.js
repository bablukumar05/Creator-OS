import mongoose from 'mongoose';
import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from './task.constants.js';
import { normalizeTaskPayload } from './task.types.js';
export const taskIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const baseTaskFields = {
  title: z.string().trim().min(1, 'This field is required').max(500),
  description: z.string().trim().max(10000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.iso.date().optional(),
  category: z.string().trim().max(500).optional(),
  brand: objectIdReferenceSchema.optional(),
  brandId: objectIdReferenceSchema.optional(),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
  content: objectIdReferenceSchema.optional(),
  contentId: objectIdReferenceSchema.optional(),
  assignedTo: objectIdReferenceSchema.optional(),
};
const strictTaskObject = z.object(baseTaskFields).strict();
export function parseTaskPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || field === 'title',
    ),
  );
  const parsed = (partial ? strictTaskObject.partial() : strictTaskObject).parse(cleaned);
  return normalizeTaskPayload(parsed);
}
