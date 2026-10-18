import { BrandDocument } from './document.model.js';
import { Brand } from '../brand.model.js';
import { logBrandActivity } from '../activities/activity.service.js';
import { ApiError } from '../../../../utils/http.js';
import { z } from 'zod';
import { DOCUMENT_TYPES } from '../brand.constants.js';
const uploadDocumentSchema = z.object({
  brandId: z.string().trim(),
  title: z.string().trim().min(1, 'Title is required').max(300),
  type: z.enum(DOCUMENT_TYPES).optional(),
  fileUrl: z.string().trim().min(1, 'File URL is required').max(2000),
  size: z.coerce.number().min(0).optional(),
});
export async function listDocuments(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const brandId = req.params.brandId || req.query.brandId;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  };
  if (brandId) criteria.brandId = brandId;
  if (req.query.type) criteria.type = String(req.query.type);
  const items = await BrandDocument.find(criteria)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email avatar')
    .lean();
  return { items, total: items.length };
}
export async function uploadDocument(req, body) {
  const payload = uploadDocumentSchema.parse({
    ...body,
    brandId: req.params.brandId || body.brandId,
  });
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await Brand.findOne({
    _id: payload.brandId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!brand) throw new ApiError(404, 'Brand not found.');
  const doc = await BrandDocument.create({
    organizationId: req.organizationId,
    owner: ownerId,
    brandId: brand._id,
    title: payload.title,
    type: payload.type || 'Other',
    fileUrl: payload.fileUrl,
    size: payload.size || 0,
    uploadedBy: req.user._id,
  });
  await logBrandActivity({
    organizationId: req.organizationId,
    brandId: brand._id,
    actorId: req.user._id,
    action: 'Document Uploaded',
    metadata: { documentId: doc._id, title: doc.title, type: doc.type },
  });
  return doc;
}
export async function deleteDocument(req, docId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const doc = await BrandDocument.findOneAndDelete({
    _id: docId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!doc) throw new ApiError(404, 'Document not found.');
  return { success: true, message: 'Document deleted.' };
}
