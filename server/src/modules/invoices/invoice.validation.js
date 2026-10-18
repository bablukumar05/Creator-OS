import mongoose from 'mongoose';
import { z } from 'zod';
import { INVOICE_STATUSES } from './invoice.constants.js';
import { normalizeInvoicePayload } from './invoice.types.js';
export const invoiceIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const invoiceLineItemSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  quantity: z.coerce.number().positive().max(1e6),
  rate: z.coerce.number().min(0).max(1e9),
  amount: z.coerce.number().min(0).max(1e12).optional(),
});
const baseInvoiceFields = {
  title: z.string().trim().min(1, 'This field is required').max(500),
  number: z.string().trim().max(100).optional(),
  brand: objectIdReferenceSchema.optional(),
  brandId: objectIdReferenceSchema.optional(),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
  clientEmail: z.email().optional(),
  clientAddress: z.string().trim().max(10000).optional(),
  date: z.iso.date().optional(),
  dueDate: z.iso.date().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  items: z.array(invoiceLineItemSchema).min(1).max(100).optional(),
  tax: z.coerce.number().min(0).max(100, 'Percentage cannot exceed 100').optional(),
  tdsRate: z.coerce.number().min(0).max(100).optional(),
  discount: z.coerce.number().min(0).max(1e12).optional(),
  paidAmount: z.coerce.number().min(0).max(1e12).optional(),
  notes: z.string().trim().max(10000).optional(),
};
const strictInvoiceObject = z.object(baseInvoiceFields).strict();
export function parseInvoicePayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(
      ([field, value]) =>
        (value !== '' && value !== null) || field === 'title',
    ),
  );
  if (Array.isArray(cleaned.items)) {
    cleaned.items = cleaned.items.map((item) => ({
      ...item,
      description: item.description || item.title || 'Service Item',
    }));
  }
  const parsed = (partial ? strictInvoiceObject.partial() : strictInvoiceObject).parse(cleaned);
  return normalizeInvoicePayload(parsed);
}
