import { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Percent,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Loading, ErrorView, StatCard, Modal } from '../components/ui';
import { marketplaceApi } from '../services/marketplaceApi';
export default function TalentRoster() {
  const [talent, setTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [representationType, setRepresentationType] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newTalent, setNewTalent] = useState({
    creatorId: '',
    representationType: 'Exclusive',
    commissionRate: 15,
    notes: '',
    contractStartDate: new Date().toISOString().split('T')[0],
  });
  const [availableCreators, setAvailableCreators] = useState([]);
  useEffect(() => {
    fetchTalent();
    fetchCreatorsForDropdown();
  }, [representationType, statusFilter]);
  const fetchTalent = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        ...(representationType && { representationType }),
        ...(statusFilter && { status: statusFilter }),
      };
      const res = await marketplaceApi.listTalent(params);
      setTalent(res.items || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchCreatorsForDropdown = async () => {
    try {
      const res = await marketplaceApi.discoverCreators({ limit: 50 });
      setAvailableCreators(res.items || []);
      if (res.items?.length > 0) {
        setNewTalent((prev) => ({ ...prev, creatorId: res.items[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load creators dropdown:', err);
    }
  };
  const handleAddTalent = async (e) => {
    e.preventDefault();
    if (!newTalent.creatorId) {
      toast.error('Please select a creator.');
      return;
    }
    try {
      setAddLoading(true);
      await marketplaceApi.addTalent(newTalent);
      toast.success('Creator added to agency talent roster!');
      setShowAddModal(false);
      fetchTalent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add talent.');
    } finally {
      setAddLoading(false);
    }
  };
  const handleRemoveTalent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your agency roster?`)) return;
    try {
      await marketplaceApi.removeTalent(id);
      toast.success(`${name} removed from roster.`);
      fetchTalent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove talent.');
    }
  };
  const filteredTalent = talent.filter((t) => {
    if (!search) return true;
    const name = t.creatorId?.displayName || '';
    const username = t.creatorId?.username || '';
    return name.toLowerCase().includes(search.toLowerCase()) || username.toLowerCase().includes(search.toLowerCase());
  });
  const totalTalent = talent.length;
  const exclusiveCount = talent.filter((t) => t.representationType === 'Exclusive').length;
  const managedCount = talent.filter((t) => t.representationType === 'Managed').length;
  const avgCommission = totalTalent > 0
    ? (talent.reduce((acc, t) => acc + (t.commissionRate || 0), 0) / totalTalent).toFixed(1)
    : 0;
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Users size={24} className="text-[#2b5341]" /> Talent Roster & Agency Management
          </h1>
          <p className="text-xs text-muted">
            Manage your agency roster, tenant-isolated creator contracts, and commission splits.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={15} /> Add Creator to Roster
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Talent Roster" value={totalTalent} icon={Users} detail="Active roster creators" />
        <StatCard label="Exclusive Roster" value={exclusiveCount} icon={ShieldCheck} detail="Exclusive representation" />
        <StatCard label="Managed Talent" value={managedCount} icon={UserCheck} detail="Direct campaign management" />
        <StatCard label="Avg Commission Rate" value={`${avgCommission}%`} icon={Percent} detail="Agency revenue split" />
      </div>
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search roster by creator name or username..."
              className="input pl-9 w-full text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={15} className="absolute left-3 top-3 text-muted" />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="btn btn-secondary py-1 text-xs"
              value={representationType}
              onChange={(e) => setRepresentationType(e.target.value)}
            >
              <option value="">All Representation</option>
              <option value="Exclusive">Exclusive</option>
              <option value="Non-Exclusive">Non-Exclusive</option>
              <option value="Managed">Managed</option>
              <option value="Freelance">Freelance</option>
            </select>
            <select
              className="btn btn-secondary py-1 text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive / Expired</option>
              <option value="">All Statuses</option>
            </select>
          </div>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView error={error} retry={fetchTalent} />
      ) : filteredTalent.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <Users size={32} className="mx-auto text-muted" />
          <h3 className="text-base font-semibold">No roster entries found</h3>
          <p className="text-xs text-muted">Add creators to your agency talent roster to begin managing partnerships.</p>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={14} /> Add First Roster Entry
          </Button>
        </div>
      ) : (
        <div className="card overflow-hidden border border-line">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-line text-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Creator</th>
                  <th className="p-3.5">Representation</th>
                  <th className="p-3.5">Commission %</th>
                  <th className="p-3.5">Contract Start</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Private Notes</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredTalent.map((item) => (
                  <tr key={item._id} className="hover:bg-canvas/50">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.creatorId?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.creatorId?.displayName || 'C')}&background=2b5341&color=fff`}
                          alt="Creator"
                          className="w-9 h-9 rounded-xl object-cover border border-line"
                        />
                        <div>
                          <p className="font-semibold text-ink">{item.creatorId?.displayName || 'Roster Creator'}</p>
                          <p className="text-[10px] text-muted">@{item.creatorId?.username || 'user'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${
                        item.representationType === 'Exclusive' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-card border border-line text-muted'
                      }`}>
                        {item.representationType}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700 dark:text-emerald-400">
                      {item.commissionRate || 0}%
                    </td>
                    <td className="p-3.5 text-muted">
                      {item.contractStartDate ? new Date(item.contractStartDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3.5">
                      <Badge>{item.status || 'Active'}</Badge>
                    </td>
                    <td className="p-3.5 text-muted max-w-xs truncate">
                      {item.notes || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleRemoveTalent(item._id, item.creatorId?.displayName || 'Creator')}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        title="Remove from roster"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showAddModal && (
        <Modal title="Add Creator to Agency Roster" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddTalent} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Select Creator</label>
              <select
                className="btn btn-secondary w-full justify-between"
                value={newTalent.creatorId}
                onChange={(e) => setNewTalent({ ...newTalent, creatorId: e.target.value })}
                required
              >
                {availableCreators.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.displayName} (@{c.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Representation Type</label>
                <select
                  className="btn btn-secondary w-full"
                  value={newTalent.representationType}
                  onChange={(e) => setNewTalent({ ...newTalent, representationType: e.target.value })}
                >
                  <option value="Exclusive">Exclusive</option>
                  <option value="Non-Exclusive">Non-Exclusive</option>
                  <option value="Managed">Managed</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">Commission Split (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input w-full"
                  value={newTalent.commissionRate}
                  onChange={(e) => setNewTalent({ ...newTalent, commissionRate: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Private Roster Notes</label>
              <textarea
                rows="3"
                className="input w-full py-2 text-xs"
                placeholder="Internal roster notes, contract terms, or special agency conditions..."
                value={newTalent.notes}
                onChange={(e) => setNewTalent({ ...newTalent, notes: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={addLoading}>
                <Plus size={14} /> Add to Roster
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
