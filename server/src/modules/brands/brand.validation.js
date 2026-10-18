import mongoose from 'mongoose';
import { z } from 'zod';
import {
  BRAND_PRIORITIES,
  BRAND_SOURCES,
  BRAND_STATUSES,
  COMPANY_SIZES,
} from './brand.constants.js';
import { normalizeBrandPayload } from './brand.types.js';
export const brandIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid reference ID.');
const httpUrlSchema = z
  .string()
  .trim()
  .refine((v) => !v || /^https?:\/\/[^\s]+$/.test(v), 'Must be a valid HTTP(S) URL')
  .optional()
  .or(z.literal(''));
const contactItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    role: z.string().trim().max(100).optional(),
    email: z.email().optional(),
    phone: z.string().trim().max(50).optional(),
    isPrimary: z.boolean().optional(),
  })
  .strict();
const baseBrandFields = {
  title: z.string().trim().min(1, 'This field is required').max(500).optional(),
  name: z.string().trim().min(1, 'This field is required').max(500).optional(),
  slug: z.string().trim().max(200).optional(),
  logo: httpUrlSchema.optional(),
  website: httpUrlSchema.optional(),
  industry: z.string().trim().max(200).optional(),
  companySize: z.enum(COMPANY_SIZES).optional(),
  country: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  description: z.string().trim().max(10000).optional(),
  status: z.enum(BRAND_STATUSES).optional(),
  source: z.enum(BRAND_SOURCES).optional(),
  priority: z.enum(BRAND_PRIORITIES).optional(),
  assignedTo: objectIdSchema.optional().nullable(),
  tags: z.array(z.string().trim().max(50)).max(50).optional(),
  contactPerson: z.string().trim().max(200).optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().trim().max(50).optional(),
  contacts: z.array(contactItemSchema).max(25).optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictBrandObject = z.object(baseBrandFields).strict();
export function parseBrandPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || ['title', 'name'].includes(field),
    ),
  );
  const parsed = (partial ? strictBrandObject.partial() : strictBrandObject).parse(cleaned);
  const normalized = normalizeBrandPayload(parsed);
  if (!partial && !normalized.title) {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['title'],
        message: 'Brand name is required',
      },
    ]);
  }
  return normalized;
}
