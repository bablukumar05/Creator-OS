import mongoose from 'mongoose';
import { z } from 'zod';
import { DEAL_PAYMENT_STATUSES, DEAL_STATUSES } from './deal.constants.js';
import { normalizeDealPayload } from './deal.types.js';
export const dealIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const baseDealFields = {
  title: z.string().trim().min(1, 'This field is required').max(500),
  brand: objectIdReferenceSchema.optional(),
  brandId: objectIdReferenceSchema.optional(),
  description: z.string().trim().max(10000).optional(),
  amount: z.coerce.number().min(0).max(1e12).optional(),
  status: z.enum(DEAL_STATUSES).optional(),
  paymentStatus: z.enum(DEAL_PAYMENT_STATUSES).optional(),
  startDate: z.iso.date().optional(),
  deadline: z.iso.date().optional(),
  paymentDueDate: z.iso.date().optional(),
  deliverables: z.string().trim().max(10000).optional(),
  contract: objectIdReferenceSchema.optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictDealObject = z.object(baseDealFields).strict();
export function parseDealPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || field === 'title',
    ),
  );
  const parsed = (partial ? strictDealObject.partial() : strictDealObject).parse(cleaned);
  return normalizeDealPayload(parsed);
}
