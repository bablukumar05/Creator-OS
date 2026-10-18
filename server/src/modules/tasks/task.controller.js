import { parseTaskPayload, taskIdSchema } from './task.validation.js';
import * as service from './task.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listTasks(req);
  ok(res, data);
}
export async function detail(req, res) {
  const taskId = taskIdSchema.parse(req.params.id);
  const task = await service.getTaskById(req, taskId);
  ok(res, task);
}
export async function related(req, res) {
  const taskId = taskIdSchema.parse(req.params.id);
  await service.getTaskById(req, taskId);
  ok(res, []);
}
export async function create(req, res) {
  const payload = parseTaskPayload(req.body, false);
  const task = await service.createTask(req, payload);
  ok(res, task, 'Created successfully.', 201);
}
export async function update(req, res) {
  const taskId = taskIdSchema.parse(req.params.id);
  const payload = parseTaskPayload(req.body, true);
  const task = await service.updateTask(req, taskId, payload, req.body);
  ok(res, task, 'Changes saved.');
}
export async function remove(req, res) {
  const taskId = taskIdSchema.parse(req.params.id);
  await service.archiveTask(req, taskId);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const taskId = taskIdSchema.parse(req.params.id);
  const copy = await service.duplicateTask(req, taskId);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const taskId = taskIdSchema.parse(req.params.id);
  const restored = await service.restoreTask(req, taskId);
  ok(res, restored, 'Record restored.');
}
