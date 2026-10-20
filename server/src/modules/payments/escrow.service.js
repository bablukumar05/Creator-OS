import { EscrowAccount } from './escrow.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { ApiError } from '../../../utils/http.js';

export async function listEscrows(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  };
  if (req.query.status) {
    criteria.status = req.query.status;
  }
  const items = await EscrowAccount.find(criteria)
    .sort({ createdAt: -1 })
    .populate('brandId', 'name title')
    .populate('dealId', 'title amount status')
    .populate('campaignId', 'title budget status')
    .lean();
  return { items, total: items.length };
}

export async function getEscrowById(req, id) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const escrow = await EscrowAccount.findOne({
    _id: id,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  })
    .populate('brandId', 'name title logo contactPerson contactEmail')
    .populate('dealId', 'title amount status')
    .populate('campaignId', 'title budget status')
    .lean();

  if (!escrow) throw new ApiError(404, 'Escrow account not found.');
  return escrow;
}

export async function createEscrow(req, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const milestones = Array.isArray(payload.milestones) ? payload.milestones : [];
  // sum milestone amounts or fallback to explicit totalAmount
  const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0) || Number(payload.totalAmount || 0);

  const escrow = await EscrowAccount.create({
    ...payload,
    totalAmount,
    milestones: milestones.map((m) => ({
      title: m.title,
      description: m.description,
      amount: Number(m.amount),
      dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      status: 'pending_deposit',
    })),
    organizationId: req.organizationId,
    owner: ownerId,
    createdBy: req.user._id,
  });

  return escrow;
}

export async function fundMilestone(req, escrowId, milestoneId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const escrow = await EscrowAccount.findOne({
    _id: escrowId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!escrow) throw new ApiError(404, 'Escrow account not found.');

  const milestone = escrow.milestones.id(milestoneId);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  if (milestone.status !== 'pending_deposit') {
    throw new ApiError(400, `Milestone is already ${milestone.status}.`);
  }

  milestone.status = 'funded';
  milestone.fundedAt = new Date();
  escrow.heldAmount = (escrow.heldAmount || 0) + milestone.amount;

  const allFunded = escrow.milestones.every((m) => m.status !== 'pending_deposit');
  escrow.status = allFunded ? 'funded' : 'partially_funded';

  await escrow.save();
  return escrow;
}

export async function submitMilestoneWork(req, escrowId, milestoneId, payload) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const escrow = await EscrowAccount.findOne({
    _id: escrowId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!escrow) throw new ApiError(404, 'Escrow account not found.');

  const milestone = escrow.milestones.id(milestoneId);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  if (milestone.status !== 'funded' && milestone.status !== 'submitted') {
    throw new ApiError(400, 'Milestone must be funded before submitting deliverables.');
  }

  milestone.status = 'submitted';
  milestone.deliverableUrl = payload.deliverableUrl || milestone.deliverableUrl;
  milestone.deliverableNotes = payload.deliverableNotes || milestone.deliverableNotes;
  milestone.submittedAt = new Date();

  await escrow.save();
  return escrow;
}

export async function approveMilestone(req, escrowId, milestoneId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const escrow = await EscrowAccount.findOne({
    _id: escrowId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!escrow) throw new ApiError(404, 'Escrow account not found.');

  const milestone = escrow.milestones.id(milestoneId);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  if (milestone.status !== 'submitted') {
    throw new ApiError(400, 'Milestone work has not been submitted yet.');
  }

  milestone.status = 'approved';
  milestone.approvedAt = new Date();

  await escrow.save();
  return escrow;
}

export async function releaseMilestone(req, escrowId, milestoneId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const escrow = await EscrowAccount.findOne({
    _id: escrowId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!escrow) throw new ApiError(404, 'Escrow account not found.');

  const milestone = escrow.milestones.id(milestoneId);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  if (milestone.status !== 'approved' && milestone.status !== 'funded' && milestone.status !== 'submitted') {
    throw new ApiError(400, 'Milestone cannot be released in current state.');
  }

  milestone.status = 'released';
  milestone.releasedAt = new Date();

  escrow.heldAmount = Math.max(0, (escrow.heldAmount || 0) - milestone.amount);
  escrow.releasedAmount = (escrow.releasedAmount || 0) + milestone.amount;

  const allReleased = escrow.milestones.every((m) => m.status === 'released');
  if (allReleased) {
    escrow.status = 'completed';
  }

  await escrow.save();
  return escrow;
}

export async function disputeMilestone(req, escrowId, milestoneId, reason) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const escrow = await EscrowAccount.findOne({
    _id: escrowId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!escrow) throw new ApiError(404, 'Escrow account not found.');

  const milestone = escrow.milestones.id(milestoneId);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');

  milestone.status = 'disputed';
  milestone.disputeReason = reason;
  milestone.disputeRaisedAt = new Date();
  escrow.status = 'disputed';

  await escrow.save();
  return escrow;
}

export async function resolveMilestoneDispute(req, escrowId, milestoneId, resolution) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const escrow = await EscrowAccount.findOne({
    _id: escrowId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  });
  if (!escrow) throw new ApiError(404, 'Escrow account not found.');

  const milestone = escrow.milestones.id(milestoneId);
  if (!milestone) throw new ApiError(404, 'Milestone not found.');
  if (milestone.status !== 'disputed') {
    throw new ApiError(400, 'Milestone is not under dispute.');
  }

  milestone.disputeResolvedAt = new Date();
  milestone.disputeResolution = resolution;

  if (resolution === 'released_to_creator') {
    milestone.status = 'released';
    milestone.releasedAt = new Date();
    escrow.heldAmount = Math.max(0, (escrow.heldAmount || 0) - milestone.amount);
    escrow.releasedAmount = (escrow.releasedAmount || 0) + milestone.amount;
  } else if (resolution === 'refunded_to_brand') {
    milestone.status = 'pending_deposit';
    escrow.heldAmount = Math.max(0, (escrow.heldAmount || 0) - milestone.amount);
    escrow.refundedAmount = (escrow.refundedAmount || 0) + milestone.amount;
  }

  const anyDisputed = escrow.milestones.some((m) => m.status === 'disputed');
  if (!anyDisputed) {
    const allReleased = escrow.milestones.every((m) => m.status === 'released');
    escrow.status = allReleased ? 'completed' : 'funded';
  }

  await escrow.save();
  return escrow;
}

export async function getPaymentStats(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };

  const invoices = await Invoice.find(criteria).lean();
  const escrows = await EscrowAccount.find({
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
  }).lean();

  let totalInvoiced = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  const now = new Date();

  for (const inv of invoices) {
    totalInvoiced += inv.amount || 0;
    totalCollected += inv.paidAmount || 0;
    totalPending += inv.remainingAmount || 0;
    if (inv.status === 'Overdue' || (inv.dueDate && new Date(inv.dueDate) < now && inv.remainingAmount > 0)) {
      totalOverdue += inv.remainingAmount || 0;
    }
  }

  let totalHeldInEscrow = 0;
  let totalReleasedEscrow = 0;
  let activeEscrowCount = 0;

  for (const esc of escrows) {
    totalHeldInEscrow += esc.heldAmount || 0;
    totalReleasedEscrow += esc.releasedAmount || 0;
    if (esc.status !== 'completed') {
      activeEscrowCount++;
    }
  }

  return {
    totalInvoiced,
    totalCollected,
    totalPending,
    totalOverdue,
    totalHeldInEscrow,
    totalReleasedEscrow,
    activeEscrowCount,
    invoicesCount: invoices.length,
    escrowsCount: escrows.length,
  };
}
