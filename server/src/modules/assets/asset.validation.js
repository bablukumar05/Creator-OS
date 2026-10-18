import mongoose from 'mongoose';
import { z } from 'zod';
import { ASSET_TYPES } from './asset.constants.js';
export const assetIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
const objectIdReferenceSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid reference');
const baseAssetFields = {
  fileName: z.string().trim().min(1, 'File name is required').max(500),
  fileUrl: z.string().trim().min(1, 'File URL is required').max(2000),
  type: z.enum(ASSET_TYPES).optional(),
  fileSize: z.coerce.number().min(0).optional(),
  mimeType: z.string().trim().max(200).optional(),
  content: objectIdReferenceSchema.optional(),
  contentId: objectIdReferenceSchema.optional(),
  campaign: objectIdReferenceSchema.optional(),
  campaignId: objectIdReferenceSchema.optional(),
};
const strictAssetObject = z.object(baseAssetFields).strict();
export function parseAssetPayload(body = {}, partial = false) {
  const cleaned = Object.fromEntries(
    Object.entries(body).filter(([field, value]) => (value !== '' && value !== null) || field === 'fileName' || field === 'fileUrl'),
  );
  return (partial ? strictAssetObject.partial() : strictAssetObject).parse(cleaned);
}
export const assetVersionPayloadSchema = z.object({
  fileUrl: z.string().trim().min(1, 'File URL is required').max(2000),
  fileSize: z.coerce.number().min(0).optional(),
  mimeType: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict();
export const presignAssetPayloadSchema = z
  .object({
    fileName: z.string().trim().min(1, 'File name is required').max(500),
    fileSize: z.coerce.number().min(0).max(5368709120, 'Maximum file size is 5GB'),
    mimeType: z.string().trim().min(1, 'MIME type is required'),
    folder: z.string().trim().max(100).optional(),
    assetType: z.string().trim().optional(),
    contentId: objectIdReferenceSchema.optional(),
    campaignId: objectIdReferenceSchema.optional(),
  })
  .strict();
export const confirmAssetPayloadSchema = z
  .object({
    fileName: z.string().trim().min(1).max(500),
    fileKey: z.string().trim().min(1),
    fileUrl: z.string().trim().min(1),
    fileSize: z.coerce.number().min(0).optional(),
    mimeType: z.string().trim().optional(),
    provider: z.enum(['s3', 'r2', 'cloudinary', 'local']).optional(),
    type: z.enum(ASSET_TYPES).optional(),
    contentId: objectIdReferenceSchema.optional(),
    campaignId: objectIdReferenceSchema.optional(),
  })
  .strict();
