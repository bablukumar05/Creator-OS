import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { money, date } from '../utils/format';
import { Button, Badge, Loading, Modal, StatCard, PageBackground } from '../components/ui';

export default function EscrowVaultPage() {
  const [escrows, setEscrows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(null);
  const [deliverableForm, setDeliverableForm] = useState({ deliverableUrl: '', deliverableNotes: '' });
  const [disputeReason, setDisputeReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [expandedEscrow, setExpandedEscrow] = useState(null);
  const [brands, setBrands] = useState([]);
  const [newEscrow, setNewEscrow] = useState({
    title: '',
    brandName: '',
    brandId: '',
    totalAmount: '',
    currency: 'INR',
    milestones: [
      { title: 'Milestone 1: Script & Concept Approval', amount: '', dueDate: '' },
      { title: 'Milestone 2: Final Video Production & Review', amount: '', dueDate: '' },
    ],
  });

  useEffect(() => {
    fetchData();
    fetchBrands();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [escrowRes, statsRes] = await Promise.all([
        api.get('/payments/escrow'),
        api.get('/payments/stats'),
      ]);
      setEscrows(escrowRes.data.data.items || []);
      setStats(statsRes.data.data || null);
      if (escrowRes.data.data.items?.length > 0) {
        setExpandedEscrow(escrowRes.data.data.items[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load escrow records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands?limit=50');
      setBrands(res.data.data.items || []);
    } catch {
    }
  };

  const handleFundMilestone = async (escrowId, milestoneId) => {
    try {
      setActionBusy(true);
      await api.post(`/payments/escrow/${escrowId}/milestones/${milestoneId}/fund`);
      toast.success('Funds deposited into secure escrow vault!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fund milestone.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!showSubmitModal) return;
    try {
      setActionBusy(true);
      await api.post(
        `/payments/escrow/${showSubmitModal.escrowId}/milestones/${showSubmitModal.milestoneId}/submit`,
        deliverableForm,
      );
      toast.success('Deliverable submitted for brand review.');
      setShowSubmitModal(null);
      setDeliverableForm({ deliverableUrl: '', deliverableNotes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deliverable.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleApproveWork = async (escrowId, milestoneId) => {
    try {
      setActionBusy(true);
      await api.post(`/payments/escrow/${escrowId}/milestones/${milestoneId}/approve`);
      toast.success('Milestone deliverable approved!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve milestone.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleReleaseFunds = async (escrowId, milestoneId) => {
    try {
      setActionBusy(true);
      await api.post(`/payments/escrow/${escrowId}/milestones/${milestoneId}/release`);
      toast.success('Escrow funds released to creator wallet!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release escrow funds.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDisputeMilestone = async () => {
    if (!showDisputeModal) return;
    try {
      setActionBusy(true);
      await api.post(
        `/payments/escrow/${showDisputeModal.escrowId}/milestones/${showDisputeModal.milestoneId}/dispute`,
        { reason: disputeReason },
      );
      toast.success('Dispute ticket raised. Escrow frozen.');
      setShowDisputeModal(null);
      setDisputeReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleResolveDispute = async (escrowId, milestoneId, resolution) => {
    try {
      setActionBusy(true);
      await api.post(
        `/payments/escrow/${escrowId}/milestones/${milestoneId}/resolve-dispute`,
        { resolution },
      );
      toast.success(`Dispute resolved: ${resolution.replace(/_/g, ' ')}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreateEscrow = async (e) => {
    e.preventDefault();
    if (!newEscrow.title) {
      toast.error('Title is required');
      return;
    }
    try {
      setActionBusy(true);
      const total = newEscrow.milestones.reduce((acc, m) => acc + Number(m.amount || 0), 0);
      await api.post('/payments/escrow', {
        ...newEscrow,
        totalAmount: total,
      });
      toast.success('Escrow Vault created successfully!');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create escrow agreement.');
    } finally {
      setActionBusy(false);
    }
  };

  const addMilestoneRow = () => {
    setNewEscrow((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { title: `Milestone ${prev.milestones.length + 1}`, amount: '', dueDate: '' },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageBackground page="finance" />
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Held in Escrow Vaults"
          value={money(stats?.totalHeldInEscrow || 0)}
          icon={ShieldCheck}
          detail="Guaranteed brand deposits"
        />
        <StatCard
          label="Released to Creators"
          value={money(stats?.totalReleasedEscrow || 0)}
          icon={CheckCircle2}
          detail="Successfully paid out"
        />
        <StatCard
          label="Total Invoiced"
          value={money(stats?.totalInvoiced || 0)}
          icon={Clock}
          detail="Across all active deals"
        />
        <StatCard
          label="Pending Collections"
          value={money(stats?.totalPending || 0)}
          icon={AlertTriangle}
          detail="Outstanding invoice dues"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-ink flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#2b5341]" /> Escrow Milestone Vaults
          </h2>
          <p className="text-xs text-muted">
            Milestone-based fund protection. Brands deposit in advance, funds are locked in escrow, and released upon deliverable approval.
          </p>
        </div>
        <Button variant="primary" className="text-xs" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} /> New Escrow Agreement
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : escrows.length === 0 ? (
        <div className="card p-10 sm:p-12 text-center space-y-3">
          <ShieldCheck size={36} className="mx-auto text-emerald-800" />
          <h3 className="text-sm sm:text-base font-semibold text-ink">No Active Escrow Vaults</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Create your first milestone escrow agreement to protect creator deliverables and ensure guaranteed brand payouts.
          </p>
          <Button variant="primary" className="text-xs" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Create Escrow Agreement
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {escrows.map((escrow) => {
            const isExpanded = expandedEscrow === escrow._id;
            const total = escrow.totalAmount || 1;
            const releasedPct = Math.min(100, Math.round(((escrow.releasedAmount || 0) / total) * 100));
            const heldPct = Math.min(100, Math.round(((escrow.heldAmount || 0) / total) * 100));

            return (
              <div key={escrow._id} className="card overflow-hidden border border-line">
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-canvas/50 transition-colors"
                  onClick={() => setExpandedEscrow(isExpanded ? null : escrow._id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base text-ink">{escrow.title}</h3>
                      <Badge>{escrow.status.toUpperCase()}</Badge>
                      <span className="text-[10px] text-muted font-medium">
                        {escrow.brandName || escrow.brandId?.title || 'Brand Deal'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                      <span>Total Value: <strong className="text-ink">{money(escrow.totalAmount)}</strong></span>
                      <span>Locked in Escrow: <strong className="text-emerald-700">{money(escrow.heldAmount)}</strong></span>
                      <span>Released: <strong className="text-[#2b5341]">{money(escrow.releasedAmount)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="w-32 sm:w-40">
                      <div className="h-2 w-full rounded-full bg-line overflow-hidden flex">
                        <div style={{ width: `${releasedPct}%` }} className="bg-[#2b5341] h-full" title={`Released: ${releasedPct}%`} />
                        <div style={{ width: `${heldPct}%` }} className="bg-amber-400 h-full" title={`Held: ${heldPct}%`} />
                      </div>
                      <p className="text-[10px] text-muted text-right mt-1">{releasedPct}% Completed</p>
                    </div>
                    <button className="icon-btn">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-line bg-canvas/30 p-4 sm:p-5 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Milestone Breakdown</h4>
                    <div className="space-y-3">
                      {escrow.milestones?.map((milestone, mIdx) => (
                        <div
                          key={milestone._id || mIdx}
                          className="p-3.5 sm:p-4 rounded-xl border border-line bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-ink">{milestone.title}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  milestone.status === 'released'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : milestone.status === 'funded'
                                      ? 'bg-amber-100 text-amber-900'
                                      : milestone.status === 'approved'
                                        ? 'bg-blue-100 text-blue-900'
                                        : milestone.status === 'disputed'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-stone-100 text-stone-800'
                                }`}
                              >
                                {milestone.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <span className="font-bold text-xs text-[#2b5341]">{money(milestone.amount)}</span>
                            </div>
                            {milestone.description && <p className="text-xs text-muted">{milestone.description}</p>}
                            {milestone.dueDate && (
                              <p className="text-[11px] text-muted flex items-center gap-1">
                                <Clock size={11} /> Due: {date(milestone.dueDate)}
                              </p>
                            )}
                            {milestone.deliverableUrl && (
                              <div className="pt-1 text-xs">
                                <a
                                  href={milestone.deliverableUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-accent underline font-medium inline-flex items-center gap-1"
                                >
                                  View Deliverable Link
                                </a>
                                {milestone.deliverableNotes && (
                                  <p className="text-[11px] text-muted mt-0.5 italic">“{milestone.deliverableNotes}”</p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-line">
                            {milestone.status === 'pending_deposit' && (
                              <Button
                                variant="primary"
                                className="text-xs py-1 px-3"
                                onClick={() => handleFundMilestone(escrow._id, milestone._id)}
                                loading={actionBusy}
                              >
                                <ShieldCheck size={13} /> Deposit Funds
                              </Button>
                            )}

                            {milestone.status === 'funded' && (
                              <>
                                <Button
                                  variant="secondary"
                                  className="text-xs py-1 px-3"
                                  onClick={() => setShowSubmitModal({ escrowId: escrow._id, milestoneId: milestone._id })}
                                >
                                  <Upload size={13} /> Submit Work
                                </Button>
                                <Button
                                  variant="primary"
                                  className="text-xs py-1 px-3"
                                  onClick={() => handleReleaseFunds(escrow._id, milestone._id)}
                                  loading={actionBusy}
                                >
                                  <Check size={13} /> Direct Release
                                </Button>
                              </>
                            )}

                            {milestone.status === 'submitted' && (
                              <>
                                <Button
                                  variant="secondary"
                                  className="text-xs py-1 px-3"
                                  onClick={() => handleApproveWork(escrow._id, milestone._id)}
                                  loading={actionBusy}
                                >
                                  <Check size={13} /> Approve Work
                                </Button>
                                <Button
                                  variant="primary"
                                  className="text-xs py-1 px-3"
                                  onClick={() => handleReleaseFunds(escrow._id, milestone._id)}
                                  loading={actionBusy}
                                >
                                  <ShieldCheck size={13} /> Release Escrow
                                </Button>
                              </>
                            )}

                            {milestone.status === 'approved' && (
                              <Button
                                variant="primary"
                                className="text-xs py-1 px-3"
                                onClick={() => handleReleaseFunds(escrow._id, milestone._id)}
                                loading={actionBusy}
                              >
                                <ShieldCheck size={13} /> Release Escrow Funds
                              </Button>
                            )}

                            {milestone.status !== 'released' && milestone.status !== 'disputed' && (
                              <button
                                type="button"
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs"
                                title="Raise Dispute"
                                onClick={() => setShowDisputeModal({ escrowId: escrow._id, milestoneId: milestone._id })}
                              >
                                <AlertTriangle size={14} />
                              </button>
                            )}

                            {milestone.status === 'disputed' && (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="secondary"
                                  className="text-[11px] py-1 px-2"
                                  onClick={() => handleResolveDispute(escrow._id, milestone._id, 'released_to_creator')}
                                  loading={actionBusy}
                                >
                                  Release to Creator
                                </Button>
                                <Button
                                  variant="secondary"
                                  className="text-[11px] py-1 px-2 text-red-600"
                                  onClick={() => handleResolveDispute(escrow._id, milestone._id, 'refunded_to_brand')}
                                  loading={actionBusy}
                                >
                                  Refund Brand
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <Modal title="Create New Escrow Agreement" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateEscrow} className="space-y-4">
            <div>
              <label className="label">Agreement Title *</label>
              <input
                className="input"
                placeholder="e.g. Nike Winter Campaign Deliverables"
                value={newEscrow.title}
                onChange={(e) => setNewEscrow({ ...newEscrow, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Brand Partner</label>
                <select
                  className="input"
                  value={newEscrow.brandId}
                  onChange={(e) => {
                    const b = brands.find((x) => x._id === e.target.value);
                    setNewEscrow({ ...newEscrow, brandId: e.target.value, brandName: b?.title || '' });
                  }}
                >
                  <option value="">Select Brand...</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Currency</label>
                <select
                  className="input"
                  value={newEscrow.currency}
                  onChange={(e) => setNewEscrow({ ...newEscrow, currency: e.target.value })}
                >
                  {['INR', 'USD', 'EUR', 'GBP'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Milestones & Tranches</label>
                <button type="button" onClick={addMilestoneRow} className="text-xs font-semibold text-[#2b5341] flex items-center gap-1">
                  <Plus size={13} /> Add Milestone
                </button>
              </div>

              {newEscrow.milestones.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-line bg-canvas space-y-2 text-xs">
                  <input
                    className="input text-xs"
                    placeholder="Milestone title"
                    value={m.title}
                    onChange={(e) => {
                      const updated = [...newEscrow.milestones];
                      updated[idx].title = e.target.value;
                      setNewEscrow({ ...newEscrow, milestones: updated });
                    }}
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      className="input text-xs"
                      placeholder="Amount"
                      value={m.amount}
                      onChange={(e) => {
                        const updated = [...newEscrow.milestones];
                        updated[idx].amount = e.target.value;
                        setNewEscrow({ ...newEscrow, milestones: updated });
                      }}
                      required
                    />
                    <input
                      type="date"
                      className="input text-xs"
                      value={m.dueDate}
                      onChange={(e) => {
                        const updated = [...newEscrow.milestones];
                        updated[idx].dueDate = e.target.value;
                        setNewEscrow({ ...newEscrow, milestones: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={actionBusy}>
                <Sparkles size={14} /> Create Escrow Vault
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showSubmitModal && (
        <Modal title="Submit Deliverable for Review" onClose={() => setShowSubmitModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Asset / Deliverable URL (Drive, Frame.io, YouTube Unlisted) *</label>
              <input
                className="input"
                placeholder="https://drive.google.com/..."
                value={deliverableForm.deliverableUrl}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, deliverableUrl: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Notes / Instructions for Brand</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Review cut v1 ready for feedback..."
                value={deliverableForm.deliverableNotes}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, deliverableNotes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button variant="secondary" onClick={() => setShowSubmitModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitWork} loading={actionBusy}>
                Submit to Brand
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showDisputeModal && (
        <Modal title="Raise Escrow Dispute Ticket" onClose={() => setShowDisputeModal(null)}>
          <div className="space-y-4">
            <p className="text-xs text-muted">
              Raising a dispute will immediately freeze escrow release. Both parties and admin will review the deliverables.
            </p>
            <div>
              <label className="label">Reason for Dispute *</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Describe the discrepancy or unmet milestone deliverables..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button variant="secondary" onClick={() => setShowDisputeModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" className="bg-red-700 hover:bg-red-800 text-white" onClick={handleDisputeMilestone} loading={actionBusy}>
                Freeze & Raise Dispute
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </div>
  );
}

export { EscrowVaultPage as EscrowVaultManager };
