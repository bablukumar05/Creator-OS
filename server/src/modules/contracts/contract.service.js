import crypto from 'node:crypto';
import { Contract } from './contract.model.js';
import { CONTRACT_SORT_FIELDS } from './contract.constants.js';
import {
  archiveWithinOrganization,
  createForOrganization,
  findAllByOrganization,
  findByIdWithinOrganization,
  restoreWithinOrganization,
} from './contract.repository.js';
import { findByIdWithinOrganization as findBrandByIdWithinOrganization } from '../brands/brand.repository.js';
import { findByIdWithinOrganization as findCampaignByIdWithinOrganization } from '../campaigns/campaign.repository.js';
import { findByIdWithinOrganization as findDealByIdWithinOrganization } from '../deals/deal.repository.js';
import { models } from '../../../models/resources.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_FIELDS = [
  'brand',
  'brandId',
  'campaign',
  'campaignId',
  'deal',
  'dealId',
  'effectiveDate',
  'expirationDate',
  'signedAt',
  'signedBy',
  'fileUrl',
  'media',
  'terms',
  'deliverables',
  'notes',
];
async function verifyContractRelations(data, organizationId, ownerId) {
  const targetBrandId = data.brand || data.brandId;
  if (targetBrandId) {
    const brand = await findBrandByIdWithinOrganization(targetBrandId, organizationId, ownerId, {
      lean: true,
    });
    if (!brand) {
      throw new ApiError(400, 'Select a valid brand from your workspace.');
    }
    data.brand = brand._id;
    data.brandId = brand._id;
  }
  const targetCampaignId = data.campaign || data.campaignId;
  if (targetCampaignId) {
    const campaign = await findCampaignByIdWithinOrganization(
      targetCampaignId,
      organizationId,
      ownerId,
      { lean: true },
    );
    if (!campaign) {
      throw new ApiError(400, 'Select a valid campaign from your workspace.');
    }
    data.campaign = campaign._id;
    data.campaignId = campaign._id;
  }
  const targetDealId = data.deal || data.dealId;
  if (targetDealId) {
    const deal = await findDealByIdWithinOrganization(targetDealId, organizationId, ownerId, {
      lean: true,
    });
    if (!deal) {
      throw new ApiError(400, 'Select a valid deal from your workspace.');
    }
    data.deal = deal._id;
    data.dealId = deal._id;
  }
  if (data.media) {
    const mediaScopeFilter = organizationId
      ? { $or: [{ organizationId }, { organizationId: null, owner: ownerId }], deletedAt: null }
      : { owner: ownerId, deletedAt: null };
    const exists = await models.media.exists({ _id: data.media, ...mediaScopeFilter });
    if (!exists) {
      throw new ApiError(400, 'Select a valid media asset from your workspace.');
    }
  }
}
export async function listContracts(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const includeDeleted = req.query.archived === 'true';
  const criteria = {};
  if (req.query.search) {
    criteria.title = {
      $regex: escapeRegex(String(req.query.search).slice(0, 100)),
      $options: 'i',
    };
  }
  if (req.query.status) criteria.status = String(req.query.status);
  const brandFilter = req.query.brand || req.query.brandId;
  if (brandFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(brandFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.brand = String(brandFilter);
  }
  const campaignFilter = req.query.campaign || req.query.campaignId;
  if (campaignFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(campaignFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.campaign = String(campaignFilter);
  }
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
  const rawSort = String(req.query.sort || '-createdAt');
  const sortField = rawSort.replace(/^-/, '');
  const sort = CONTRACT_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
  const { items, total } = await findAllByOrganization(req.organizationId, ownerId, criteria, {
    includeDeleted,
    sort,
    skip: (page - 1) * limit,
    limit,
  });
  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}
export async function getContractById(req, contractId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contract = await findByIdWithinOrganization(contractId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!contract) throw new ApiError(404, 'Record not found.');
  return contract;
}
export async function createContract(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyContractRelations(data, req.organizationId, ownerId);
  if (!data.currency && req.organization?.settings?.currency) {
    data.currency = req.organization.settings.currency;
  }
  const contract = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Created ${contract.title}`, 'contracts', contract._id);
  return contract;
}
export async function updateContract(req, contractId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contract = await findByIdWithinOrganization(contractId, req.organizationId, ownerId);
  if (!contract) throw new ApiError(404, 'Record not found.');
  await verifyContractRelations(data, req.organizationId, ownerId);
  Object.assign(contract, data);
  contract.updatedBy = req.user._id;
  for (const field of CLEARABLE_FIELDS) {
    if (rawBody[field] === '') {
      contract.set(field, undefined);
      if (field === 'brand' || field === 'brandId') {
        contract.set('brand', undefined);
        contract.set('brandId', undefined);
      }
      if (field === 'campaign' || field === 'campaignId') {
        contract.set('campaign', undefined);
        contract.set('campaignId', undefined);
      }
      if (field === 'deal' || field === 'dealId') {
        contract.set('deal', undefined);
        contract.set('dealId', undefined);
      }
    }
  }
  await contract.save();
  await recordActivity(req, `Updated ${contract.title}`, 'contracts', contract._id);
  return contract;
}
export async function archiveContract(req, contractId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contract = await archiveWithinOrganization(
    contractId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!contract) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${contract.title}`, 'contracts', contract._id);
  return contract;
}
export async function duplicateContract(req, contractId) {
  const original = await getContractById(req, contractId);
  const { _id, createdAt, updatedAt, __v, signedAt, ...data } = original;
  data.title = `${original.title} (copy)`;
  data.status = 'Draft';
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Duplicated ${original.title}`, 'contracts', copy._id);
  return copy;
}
export async function restoreContract(req, contractId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contract = await restoreWithinOrganization(
    contractId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!contract) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${contract.title}`, 'contracts', contract._id);
  return contract;
}

export async function getContractBySigningToken(token) {
  const contract = await Contract.findOne({
    signingToken: token,
    deletedAt: null,
  })
    .populate('brand', 'name title contactPerson contactEmail')
    .populate('organizationId', 'name')
    .lean();

  if (!contract) {
    throw new ApiError(404, 'Contract agreement not found or signing link expired.');
  }

  return contract;
}

export async function signContractPublic(token, payload, req) {
  const { signedByName, signerEmail, signatureDataUrl } = payload;

  if (!signedByName || !signatureDataUrl) {
    throw new ApiError(400, 'Signer name and signature drawing are required.');
  }

  const contract = await Contract.findOne({
    signingToken: token,
    deletedAt: null,
  });

  if (!contract) {
    throw new ApiError(404, 'Contract not found or expired.');
  }

  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  const docData = `${contract._id}-${contract.amount}-${contract.terms || ''}-${Date.now()}`;
  const docHash = crypto.createHash('sha256').update(docData).digest('hex');

  contract.brandSignature = {
    signedByName: signedByName.trim(),
    signerEmail: signerEmail ? signerEmail.trim().toLowerCase() : contract.brand?.contactEmail || '',
    signatureDataUrl,
    signedAt: new Date(),
    ipAddress: String(ipAddress),
    userAgent: String(userAgent).slice(0, 500),
    documentHash: docHash,
  };

  const creatorHasSigned = Boolean(contract.creatorSignature?.signatureDataUrl);
  if (creatorHasSigned) {
    contract.isFullyExecuted = true;
    contract.executedAt = new Date();
    contract.status = 'Signed';
    contract.signedAt = new Date();
    contract.signedBy = signedByName;
    contract.documentHash = docHash;
  } else {
    contract.status = 'Pending Review';
  }

  contract.auditTrail.push({
    event: 'Brand Counter-Signed Agreement',
    performedBy: signedByName,
    ipAddress: String(ipAddress),
    userAgent: String(userAgent).slice(0, 500),
    timestamp: new Date(),
    hash: docHash,
  });

  await contract.save();

  const io = req.app.get('io');
  if (io && contract.organizationId) {
    io.to(`org:${contract.organizationId}`).emit('contract-signed', {
      contractId: contract._id,
      title: contract.title,
      signedBy: signedByName,
      isFullyExecuted: contract.isFullyExecuted,
    });
  }

  return contract;
}

export async function signContractInApp(req, contractId, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contract = await Contract.findOne({
    _id: contractId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  });

  if (!contract) {
    throw new ApiError(404, 'Contract not found.');
  }

  const { signedByName, signatureDataUrl } = payload;
  if (!signedByName || !signatureDataUrl) {
    throw new ApiError(400, 'Signer name and digital signature are required.');
  }

  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';

  const docData = `${contract._id}-${contract.amount}-${contract.terms || ''}-${Date.now()}`;
  const docHash = crypto.createHash('sha256').update(docData).digest('hex');

  contract.creatorSignature = {
    signedByName: signedByName.trim(),
    signatureDataUrl,
    signedAt: new Date(),
    ipAddress: String(ipAddress),
    userAgent: String(userAgent).slice(0, 500),
    documentHash: docHash,
  };

  const brandHasSigned = Boolean(contract.brandSignature?.signatureDataUrl);
  if (brandHasSigned) {
    contract.isFullyExecuted = true;
    contract.executedAt = new Date();
    contract.status = 'Signed';
    contract.signedAt = new Date();
    contract.signedBy = contract.brandSignature?.signedByName || signedByName;
    contract.documentHash = docHash;
  }

  contract.auditTrail.push({
    event: 'Creator E-Signed Agreement',
    performedBy: signedByName,
    ipAddress: String(ipAddress),
    userAgent: String(userAgent).slice(0, 500),
    timestamp: new Date(),
    hash: docHash,
  });

  await contract.save();
  await recordActivity(req, `Digitally signed contract ${contract.title}`, 'contracts', contract._id);
  return contract;
}

export async function getAuditCertificate(req, contractId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const contract = await Contract.findOne({
    _id: contractId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  })
    .populate('brand', 'name title')
    .populate('organizationId', 'name')
    .lean();

  if (!contract) {
    throw new ApiError(404, 'Contract not found.');
  }

  return {
    contractId: contract._id,
    contractNumber: contract.contractNumber,
    title: contract.title,
    amount: contract.amount,
    currency: contract.currency,
    isFullyExecuted: contract.isFullyExecuted,
    executedAt: contract.executedAt,
    documentHash: contract.documentHash,
    creatorSignature: contract.creatorSignature,
    brandSignature: contract.brandSignature,
    auditTrail: contract.auditTrail || [],
  };
}
