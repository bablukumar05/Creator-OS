import { BrandNote } from './note.model.js';
import { Brand } from '../brand.model.js';
import { logBrandActivity } from '../activities/activity.service.js';
import { ApiError } from '../../../../utils/http.js';
import { z } from 'zod';
const createNoteSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(10000),
});
export async function listNotes(req, brandId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const items = await BrandNote.find({
    brandId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email avatar')
    .lean();
  return { items, total: items.length };
}
export async function createNote(req, brandId, body) {
  const payload = createNoteSchema.parse(body);
  const ownerId = req.organization?.ownerId || req.user._id;
  const brand = await Brand.findOne({
    _id: brandId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!brand) throw new ApiError(404, 'Brand not found.');
  const note = await BrandNote.create({
    organizationId: req.organizationId,
    owner: ownerId,
    brandId: brand._id,
    content: payload.content,
    createdBy: req.user._id,
  });
  await logBrandActivity({
    organizationId: req.organizationId,
    brandId: brand._id,
    actorId: req.user._id,
    action: 'Note Added',
    metadata: { noteId: note._id, excerpt: note.content.slice(0, 100) },
  });
  return note;
}
export async function deleteNote(req, brandId, noteId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const note = await BrandNote.findOneAndDelete({
    _id: noteId,
    brandId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!note) throw new ApiError(404, 'Note not found.');
  return { success: true, message: 'Note deleted.' };
}
