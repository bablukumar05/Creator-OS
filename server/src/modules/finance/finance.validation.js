import mongoose from 'mongoose';
import { z } from 'zod';
import { platforms } from '../../../../shared/resources.js';
import {
  EXPENSE_CATEGORIES,
  REVENUE_CATEGORIES,
  REVENUE_STATUSES,
} from './finance.constants.js';
import { normalizeFinancePayload } from './finance.types.js';
export const financeIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const baseRevenueFields = {
  title: z.string().trim().min(1, 'This field is required').max(500),
  amount: z.coerce.number().min(0).max(1e12).optional(),
  category: z.enum(REVENUE_CATEGORIES).optional(),
  date: z.iso.date().optional(),
  platform: z.enum(platforms).optional(),
  brand: objectIdReferenceSchema.optional(),
  brandId: objectIdReferenceSchema.optional(),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
  status: z.enum(REVENUE_STATUSES).optional(),
  paymentMethod: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictRevenueObject = z.object(baseRevenueFields).strict();
const baseExpenseFields = {
  title: z.string().trim().min(1, 'This field is required').max(500),
  amount: z.coerce.number().min(0).max(1e12).optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  date: z.iso.date().optional(),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
  receipt: objectIdReferenceSchema.optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictExpenseObject = z.object(baseExpenseFields).strict();
export function parseRevenuePayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || field === 'title',
    ),
  );
  const parsed = (partial ? strictRevenueObject.partial() : strictRevenueObject).parse(cleaned);
  return normalizeFinancePayload(parsed);
}
export function parseExpensePayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || field === 'title',
    ),
  );
  const parsed = (partial ? strictExpenseObject.partial() : strictExpenseObject).parse(cleaned);
  return normalizeFinancePayload(parsed);
}
