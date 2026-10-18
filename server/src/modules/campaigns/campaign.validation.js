import mongoose from 'mongoose';
import { z } from 'zod';
import { platforms } from '../../../../shared/resources.js';
import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_PRIORITIES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
} from './campaign.constants.js';
import { normalizeCampaignPayload } from './campaign.types.js';
export const campaignIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const baseCampaignFields = {
  title: z.string().trim().min(1, 'This field is required').max(500).optional(),
  name: z.string().trim().min(1, 'This field is required').max(500).optional(),
  slug: z.string().trim().max(200).optional(),
  brand: objectIdReferenceSchema.optional(),
  brandId: objectIdReferenceSchema.optional(),
  description: z.string().trim().max(10000).optional(),
  objective: z.enum(CAMPAIGN_OBJECTIVES).optional(),
  campaignType: z.enum(CAMPAIGN_TYPES).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  priority: z.enum(CAMPAIGN_PRIORITIES).optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  budget: z.coerce.number().min(0).max(1e12).optional(),
  spentBudget: z.coerce.number().min(0).max(1e12).optional(),
  remainingBudget: z.coerce.number().min(0).max(1e12).optional(),
  amount: z.coerce.number().min(0).max(1e12).optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).optional(),
  platform: z.enum(platforms).optional(),
  deliverables: z.string().trim().max(10000).optional(),
  progress: z.coerce.number().min(0).max(100, 'Percentage cannot exceed 100').optional(),
  managerId: objectIdReferenceSchema.optional().nullable(),
  assignedMembers: z.array(objectIdReferenceSchema).max(50).optional(),
  tags: z.array(z.string().trim().max(50)).max(50).optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictCampaignObject = z.object(baseCampaignFields).strict();
export function parseCampaignPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || ['title', 'name'].includes(field),
    ),
  );
  const parsed = (partial ? strictCampaignObject.partial() : strictCampaignObject).parse(cleaned);
  const normalized = normalizeCampaignPayload(parsed);
  if (!partial && !normalized.title) {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['title'],
        message: 'Campaign title is required',
      },
    ]);
  }
  return normalized;
}
