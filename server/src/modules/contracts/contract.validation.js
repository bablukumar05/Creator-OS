import mongoose from 'mongoose';
import { z } from 'zod';
import { CONTRACT_STATUSES, CONTRACT_TYPES } from './contract.constants.js';
import { normalizeContractPayload } from './contract.types.js';
export const contractIdSchema = z
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
const baseContractFields = {
  contractNumber: z.string().trim().max(100).optional(),
  title: z.string().trim().min(1, 'This field is required').max(500),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  brand: objectIdReferenceSchema.optional(),
  brandId: objectIdReferenceSchema.optional(),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
  deal: objectIdReferenceSchema.optional(),
  dealId: objectIdReferenceSchema.optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  amount: z.coerce.number().min(0).max(1e12).optional(),
  value: z.coerce.number().min(0).max(1e12).optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
  effectiveDate: z.iso.date().optional(),
  startDate: z.iso.date().optional(),
  expirationDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  signedAt: z.iso.date().optional(),
  signedBy: z.string().trim().max(200).optional(),
  fileUrl: httpUrlSchema.optional(),
  media: objectIdReferenceSchema.optional(),
  terms: z.string().trim().max(10000).optional(),
  deliverables: z.string().trim().max(10000).optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictContractObject = z.object(baseContractFields).strict();
export function parseContractPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || field === 'title',
    ),
  );
  if (cleaned.startDate && !cleaned.effectiveDate) cleaned.effectiveDate = cleaned.startDate;
  if (cleaned.endDate && !cleaned.expirationDate) cleaned.expirationDate = cleaned.endDate;
  if (typeof cleaned.value === 'number' && typeof cleaned.amount !== 'number') cleaned.amount = cleaned.value;
  const parsed = (partial ? strictContractObject.partial() : strictContractObject).parse(cleaned);
  return normalizeContractPayload(parsed);
}
