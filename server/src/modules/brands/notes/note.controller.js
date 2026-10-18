import * as service from './note.service.js';
import { ok } from '../../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listNotes(req, req.params.brandId);
  ok(res, data);
}
export async function create(req, res) {
  const data = await service.createNote(req, req.params.brandId, req.body);
  ok(res, data, 'Note added successfully.', 201);
}
export async function remove(req, res) {
  const data = await service.deleteNote(req, req.params.brandId, req.params.noteId);
  ok(res, data);
}
