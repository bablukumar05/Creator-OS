import {
  financeIdSchema,
  parseExpensePayload,
  parseRevenuePayload,
} from './finance.validation.js';
import * as service from './finance.service.js';
import { ok } from '../../../utils/http.js';
export const revenueController = {
  async list(req, res) {
    ok(res, await service.listRevenue(req));
  },
  async detail(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    ok(res, await service.getRevenueById(req, id));
  },
  async related(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    await service.getRevenueById(req, id);
    ok(res, []);
  },
  async create(req, res) {
    const payload = parseRevenuePayload(req.body, false);
    const record = await service.createRevenue(req, payload);
    ok(res, record, 'Created successfully.', 201);
  },
  async update(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    const payload = parseRevenuePayload(req.body, true);
    const record = await service.updateRevenue(req, id, payload, req.body);
    ok(res, record, 'Changes saved.');
  },
  async remove(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    await service.archiveRevenue(req, id);
    ok(res, null, 'Record archived.');
  },
  async duplicate(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    const copy = await service.duplicateRevenue(req, id);
    ok(res, copy, 'Duplicated successfully.', 201);
  },
  async restore(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    const restored = await service.restoreRevenue(req, id);
    ok(res, restored, 'Record restored.');
  },
};
export const expenseController = {
  async list(req, res) {
    ok(res, await service.listExpenses(req));
  },
  async detail(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    ok(res, await service.getExpenseById(req, id));
  },
  async related(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    await service.getExpenseById(req, id);
    ok(res, []);
  },
  async create(req, res) {
    const payload = parseExpensePayload(req.body, false);
    const record = await service.createExpense(req, payload);
    ok(res, record, 'Created successfully.', 201);
  },
  async update(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    const payload = parseExpensePayload(req.body, true);
    const record = await service.updateExpense(req, id, payload, req.body);
    ok(res, record, 'Changes saved.');
  },
  async remove(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    await service.archiveExpense(req, id);
    ok(res, null, 'Record archived.');
  },
  async duplicate(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    const copy = await service.duplicateExpense(req, id);
    ok(res, copy, 'Duplicated successfully.', 201);
  },
  async restore(req, res) {
    const id = financeIdSchema.parse(req.params.id);
    const restored = await service.restoreExpense(req, id);
    ok(res, restored, 'Record restored.');
  },
};
export async function summary(req, res) {
  ok(res, await service.getFinanceSummary(req));
}
