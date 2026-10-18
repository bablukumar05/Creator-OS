import mongoose from 'mongoose';
import { z } from 'zod';
const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
export const createContactSchema = z
  .object({
    brandId: objectIdSchema,
    name: z.string().trim().min(1, 'Name is required').max(120),
    designation: z.string().trim().max(100).optional(),
    email: z.email().optional().or(z.literal('')),
    phone: z.string().trim().max(50).optional(),
    linkedin: z.string().trim().max(500).optional(),
    department: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(5000).optional(),
    isPrimary: z.boolean().optional(),
  })
  .strict();
export const updateContactSchema = createContactSchema.partial().omit({ brandId: true }).strict();
