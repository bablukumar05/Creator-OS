import mongoose from 'mongoose';
import { z } from 'zod';
import { PAYMENT_METHODS } from './payment.model.js';
const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
export const createPaymentSchema = z
  .object({
    invoiceId: objectIdSchema,
    amount: z.coerce.number().positive('Amount must be positive'),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    transactionId: z.string().trim().max(200).optional(),
    paidAt: z.iso.date().optional(),
    paymentProof: z.string().trim().max(2000).optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .strict();
