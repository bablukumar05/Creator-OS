import { contractIdSchema, parseContractPayload } from './contract.validation.js';
import * as service from './contract.service.js';
import { ok } from '../../../utils/http.js';
export async function list(req, res) {
  const data = await service.listContracts(req);
  ok(res, data);
}
export async function expiring(req, res) {
  const data = await service.getExpiringContracts(req);
  ok(res, data);
}
export async function detail(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  const contract = await service.getContractById(req, contractId);
  ok(res, contract);
}
export async function related(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  await service.getContractById(req, contractId);
  ok(res, []);
}
export async function create(req, res) {
  const payload = parseContractPayload(req.body, false);
  const contract = await service.createContract(req, payload);
  ok(res, contract, 'Created successfully.', 201);
}
export async function update(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  const payload = parseContractPayload(req.body, true);
  const contract = await service.updateContract(req, contractId, payload, req.body);
  ok(res, contract, 'Changes saved.');
}
export async function remove(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  await service.archiveContract(req, contractId);
  ok(res, null, 'Record archived.');
}
export async function duplicate(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  const copy = await service.duplicateContract(req, contractId);
  ok(res, copy, 'Duplicated successfully.', 201);
}
export async function restore(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  const restored = await service.restoreContract(req, contractId);
  ok(res, restored, 'Record restored.');
}

export async function getPublicSigningContract(req, res) {
  const contract = await service.getContractBySigningToken(req.params.token);
  ok(res, contract);
}

export async function signContractPublic(req, res) {
  const contract = await service.signContractPublic(req.params.token, req.body, req);
  ok(res, contract, 'Contract signed successfully.');
}

export async function signContractInApp(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  const contract = await service.signContractInApp(req, contractId, req.body);
  ok(res, contract, 'Contract signed successfully.');
}

export async function getAuditCertificate(req, res) {
  const contractId = contractIdSchema.parse(req.params.id);
  const cert = await service.getAuditCertificate(req, contractId);
  ok(res, cert);
}
