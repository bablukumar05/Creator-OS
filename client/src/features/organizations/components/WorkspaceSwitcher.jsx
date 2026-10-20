import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Plus, KeyRound, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useOrganization } from '../../../store';
import { memberApi } from '../../members/api/memberApi';
import { message } from '../../../services/api';
import { Button, Modal } from '../../../components/ui';
import { initials } from '../../../utils/format';
const TYPE_LABELS = {
  creator_workspace: 'Creator workspace',
  agency: 'Talent agency',
  brand_team: 'Brand team',
};
export function WorkspaceSwitcher() {
  const { user } = useAuth();
  const {
    organizations,
    currentOrganization,
    membership,
    switchWorkspace,
    createWorkspace,
    loadOrganizations,
  } = useOrganization();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const activeName =
    currentOrganization?.name || `${user?.name?.split(' ')[0] || 'Creator'}’s workspace`;
  const activeRole = membership?.role || currentOrganization?.membership?.role || 'owner';
  const activeType =
    TYPE_LABELS[currentOrganization?.type] || TYPE_LABELS.creator_workspace;
  const handleSwitch = async (organizationId) => {
    // avoid redundant network call if user re-selects current active workspace
    if (String(organizationId) === String(currentOrganization?._id)) {
      setMenuOpen(false);
      return;
    }
    setBusy(true);
    try {
      const result = await switchWorkspace(organizationId);
      setMenuOpen(false);
      toast.success(`Switched to ${result?.organization?.name || 'workspace'}`);
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      const created = await createWorkspace({
        name: form.name,
        type: form.type,
        settings: { currency: form.currency || 'INR' },
      });
      setCreateOpen(false);
      setMenuOpen(false);
      toast.success(`Created ${created.name}`);
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };
  const handleJoinWithToken = async (e) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;
    setBusy(true);
    try {
      const result = await memberApi.acceptInvite(inviteToken.trim());
      await loadOrganizations();
      setInviteToken('');
      setJoinOpen(false);
      setMenuOpen(false);
      toast.success(`Joined ${result?.organization?.name || 'organization'}`);
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="relative mx-4 mb-5">
      <button
        type="button"
        aria-label="Switch workspace"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-canvas/60 p-3 text-left transition hover:bg-canvas"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e7ecdf] text-xs font-semibold text-[#526747]">
          {initials(activeName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{activeName}</span>
          <span className="mt-0.5 block truncate text-[10px] capitalize text-muted">
            {activeType} · {activeRole}
          </span>
        </span>
        <ChevronsUpDown size={13} className="shrink-0 text-muted" />
      </button>
      {menuOpen && (
        <div className="card absolute left-0 right-0 top-[62px] z-50 p-2 shadow-lg">
          <p className="eyebrow px-2.5 py-1.5 text-[9px]">YOUR WORKSPACES</p>
          <div className="max-h-48 space-y-0.5 overflow-y-auto">
            {organizations.map((org) => {
              const isCurrent = String(org._id) === String(currentOrganization?._id);
              return (
                <button
                  key={org._id}
                  type="button"
                  disabled={busy}
                  onClick={() => handleSwitch(org._id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    isCurrent ? 'bg-sage font-medium text-accent' : 'hover:bg-canvas'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{org.name}</span>
                    <span className="block text-[10px] capitalize text-muted">
                      {org.membership?.role || 'member'}
                    </span>
                  </span>
                  {isCurrent && <Check size={13} className="shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>
          <div className="mt-2 space-y-1 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setCreateOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted hover:bg-canvas hover:text-ink"
            >
              <Plus size={13} />
              New organization
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setJoinOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted hover:bg-canvas hover:text-ink"
            >
              <KeyRound size={13} />
              Join with invite token
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate('/settings');
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted hover:bg-canvas hover:text-ink"
            >
              <Settings2 size={13} />
              Workspace & team settings
            </button>
          </div>
        </div>
      )}
      {createOpen && (
        <Modal title="Create a new organization" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label" htmlFor="org-name">
                Organization name
              </label>
              <input
                id="org-name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Studio Horizon or Acme Talent"
                className="input"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="org-type">
                  Workspace type
                </label>
                <select id="org-type" name="type" className="input" defaultValue="creator_workspace">
                  <option value="creator_workspace">Creator workspace</option>
                  <option value="agency">Talent agency</option>
                  <option value="brand_team">Brand team</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="org-currency">
                  Default currency
                </label>
                <select id="org-currency" name="currency" className="input" defaultValue="INR">
                  {['INR', 'USD', 'EUR', 'GBP'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button loading={busy}>Create workspace</Button>
            </div>
          </form>
        </Modal>
      )}
      {joinOpen && (
        <Modal title="Join an organization" onClose={() => setJoinOpen(false)}>
          <form onSubmit={handleJoinWithToken} className="space-y-4">
            <p className="text-xs leading-relaxed text-muted">
              Paste the invitation token shared by your organization owner or manager. Your signed-in
              email ({user?.email}) must match the invited address.
            </p>
            <div>
              <label className="label" htmlFor="invite-token-input">
                Invitation token
              </label>
              <input
                id="invite-token-input"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                required
                minLength={16}
                placeholder="Paste 64-character invite token"
                className="input font-mono text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setJoinOpen(false)}>
                Cancel
              </Button>
              <Button loading={busy}>Accept invitation</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
