import mongoose from 'mongoose';
import { z } from 'zod';
export const talentIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
export const talentPayloadSchema = z
  .object({
    creatorId: objectIdReferenceSchema,
    relationshipType: z.enum(['Exclusive', 'Non-Exclusive', 'Managed', 'Partner', 'Freelance', 'Contract']).optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
    managerId: objectIdReferenceSchema.optional(),
    commissionPercentage: z.coerce.number().min(0).max(100).optional(),
    internalNotes: z.string().trim().max(5000).optional(),
    contractId: objectIdReferenceSchema.optional(),
  })
  .strict();
