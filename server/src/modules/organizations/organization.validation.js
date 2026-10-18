import { z } from 'zod';
import {
  ORGANIZATION_CURRENCIES,
  ORGANIZATION_STATUSES,
  ORGANIZATION_TYPES,
} from './organization.types.js';
export const organizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers, and hyphens');
const settingsSchema = z
  .object({
    currency: z.enum(ORGANIZATION_CURRENCIES).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    language: z.string().trim().min(2).max(20).optional(),
  })
  .optional();
const optionalUrl = z
  .url()
  .refine((value) => /^https?:/.test(value))
  .or(z.literal(''))
  .optional();
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: organizationSlugSchema.optional(),
  type: z.enum(ORGANIZATION_TYPES).optional(),
  logo: optionalUrl,
  description: z.string().trim().max(1000).optional(),
  website: optionalUrl,
  settings: settingsSchema,
});
export const updateOrganizationSchema = createOrganizationSchema
  .partial()
  .extend({
    status: z.enum(ORGANIZATION_STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });
export const organizationIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID');
