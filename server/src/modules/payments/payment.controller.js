import * as service from './payment.service.js';
import * as escrowService from './escrow.service.js';
import { createPaymentSchema } from './payment.validation.js';
import { ok } from '../../../utils/http.js';
import { getGatewayConfig } from './gateway.service.js';

export async function list(req, res) {
  const data = await service.listPayments(req);
  ok(res, data);
}

export async function detail(req, res) {
  const data = await service.getPaymentById(req, req.params.id);
  ok(res, data);
}

export async function create(req, res) {
  const payload = createPaymentSchema.parse(req.body);
  const data = await service.createPayment(req, payload);
  ok(res, data, 'Payment recorded successfully.', 201);
}

export async function remove(req, res) {
  const data = await service.deletePayment(req, req.params.id);
  ok(res, data);
}

export async function getGatewaySettings(req, res) {
  ok(res, getGatewayConfig());
}

export async function getStats(req, res) {
  const data = await escrowService.getPaymentStats(req);
  ok(res, data);
}

export async function listEscrows(req, res) {
  const data = await escrowService.listEscrows(req);
  ok(res, data);
}

export async function getEscrow(req, res) {
  const data = await escrowService.getEscrowById(req, req.params.id);
  ok(res, data);
}

export async function createEscrow(req, res) {
  const data = await escrowService.createEscrow(req, req.body);
  ok(res, data, 'Escrow agreement created.', 201);
}

export async function fundEscrowMilestone(req, res) {
  const data = await escrowService.fundMilestone(req, req.params.id, req.params.milestoneId);
  ok(res, data, 'Milestone funded and held in escrow.');
}

export async function submitMilestoneDeliverable(req, res) {
  const data = await escrowService.submitMilestoneWork(req, req.params.id, req.params.milestoneId, req.body);
  ok(res, data, 'Deliverable submitted for review.');
}

export async function approveMilestoneWork(req, res) {
  const data = await escrowService.approveMilestone(req, req.params.id, req.params.milestoneId);
  ok(res, data, 'Milestone deliverable approved.');
}

export async function releaseEscrowMilestone(req, res) {
  const data = await escrowService.releaseMilestone(req, req.params.id, req.params.milestoneId);
  ok(res, data, 'Escrow funds successfully released to creator.');
}

export async function disputeEscrowMilestone(req, res) {
  const data = await escrowService.disputeMilestone(req, req.params.id, req.params.milestoneId, req.body.reason);
  ok(res, data, 'Dispute recorded for milestone.');
}

export async function resolveEscrowDispute(req, res) {
  const data = await escrowService.resolveMilestoneDispute(
    req,
    req.params.id,
    req.params.milestoneId,
    req.body.resolution,
  );
  ok(res, data, 'Dispute resolved successfully.');
}

export async function getPublicInvoice(req, res) {
  const data = await service.getPublicInvoice(req.params.invoiceId);
  ok(res, data);
}

export async function createPublicCheckout(req, res) {
  const originUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
  const data = await service.createPublicCheckout(req.params.invoiceId, req.body, originUrl);
  ok(res, data);
}

export async function verifyPublicPayment(req, res) {
  const io = req.app.get('io');
  const data = await service.verifyPublicPayment(req.body, io);
  ok(res, data);
}
