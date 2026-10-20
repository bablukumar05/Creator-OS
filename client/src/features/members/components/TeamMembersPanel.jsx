import { useState } from 'react';
import { UserPlus, Copy, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrganization } from '../../../store';
import { memberApi } from '../../../services/api';
import { useData } from '../../../hooks/useData';
import { message } from '../../../services/api';
import { Button, Loading, ErrorState } from '../../../components/ui';
import { initials } from '../../../utils/format';
const INVITABLE_ROLES = [
  ['manager', 'Manager — Campaigns, brands, content & invites'],
  ['creator', 'Creator — Content, campaigns & analytics'],
  ['editor', 'Editor — Assigned content, tasks & assets'],
  ['accountant', 'Accountant — Invoices, revenue & expenses'],
];
export function TeamMembersPanel() {
  const { currentOrganization, hasPermission } = useOrganization();
  const [busy, setBusy] = useState(false);
  const [latestInvite, setLatestInvite] = useState(null);
  const canInvite = hasPermission('member.invite');
  const canUpdate = hasPermission('member.update');
  const canRemove = hasPermission('member.remove');
  const membersQuery = useData(
    () => (currentOrganization?._id ? memberApi.list() : Promise.resolve({ items: [] })),
    [currentOrganization?._id],
  );
  const rolesQuery = useData(
    () => (currentOrganization?._id ? memberApi.listRoles() : Promise.resolve({ roles: [] })),
    [currentOrganization?._id],
  );
  if (membersQuery.loading && !membersQuery.data) return <Loading />;
  if (membersQuery.error) {
    return <ErrorState error={membersQuery.error} retry={membersQuery.refresh} />;
  }
  const members = membersQuery.data?.items || [];
  const roles = rolesQuery.data?.roles || [];
  const handleInvite = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      const result = await memberApi.invite({
        email: form.email,
        role: form.role,
      });
      setLatestInvite(result);
      e.target.reset();
      membersQuery.refresh();
      toast.success(`Invitation created for ${result.member.email}`);
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };
  const handleRoleChange = async (memberId, nextRole) => {
    try {
      await memberApi.update(memberId, { role: nextRole });
      membersQuery.refresh();
      toast.success('Member role updated.');
    } catch (error) {
      toast.error(message(error));
    }
  };
  const handleRemove = async (member) => {
    try {
      await memberApi.remove(member._id);
      membersQuery.refresh();
      toast.success(`Removed ${member.email || member.name}`);
    } catch (error) {
      toast.error(message(error));
    }
  };
  const copyToken = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Invitation token copied.');
    } catch {
      toast.error('Copy the token manually from the box.');
    }
  };
  return (
    <div className="space-y-7">
      {canInvite && (
        <form onSubmit={handleInvite} className="rounded-xl border border-line bg-canvas/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium">
            <UserPlus size={15} className="text-accent" />
            Invite a team member to {currentOrganization?.name}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_240px_auto]">
            <input
              name="email"
              type="email"
              required
              aria-label="Member email"
              placeholder="colleague@example.com"
              className="input"
            />
            <select
              name="role"
              aria-label="Member role"
              defaultValue="creator"
              className="input"
            >
              {INVITABLE_ROLES.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <Button loading={busy}>Send invite</Button>
          </div>
          {latestInvite?.inviteToken && (
            <div className="mt-4 rounded-lg border border-line bg-white p-3 dark:bg-[#1b241d]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">
                  One-time invite token for {latestInvite.member.email}
                </p>
                <button
                  type="button"
                  onClick={() => copyToken(latestInvite.inviteToken)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <Copy size={12} />
                  Copy token
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-muted">
                {latestInvite.inviteToken}
              </p>
            </div>
          )}
        </form>
      )}
      <div>
        <h3 className="text-sm font-medium">
          Organization members ({members.length})
        </h3>
        <div className="mt-3 space-y-2.5">
          {members.map((member) => {
            const isOwner = member.role === 'owner';
            return (
              <div
                key={member._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7ecdf] text-xs font-semibold text-[#526747]">
                    {initials(member.name || member.email || 'M')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {member.name || member.email}
                      {member.status === 'invited' && (
                        <span className="ml-2 rounded bg-[#f5f0e4] px-2 py-0.5 text-[10px] text-[#8d7543]">
                          Pending invite
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-muted">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canUpdate && !isOwner ? (
                    <select
                      aria-label={`Role for ${member.email}`}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      className="input h-8 py-1 text-xs capitalize"
                    >
                      {['manager', 'creator', 'editor', 'accountant'].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="badge bg-sage capitalize text-accent">{member.role}</span>
                  )}
                  {canRemove && !isOwner && (
                    <button
                      type="button"
                      aria-label={`Remove ${member.email}`}
                      onClick={() => handleRemove(member)}
                      className="icon-btn h-8 w-8 text-[#a16a5e]"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {roles.length > 0 && (
        <div className="border-t border-line pt-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium">
            <Shield size={14} className="text-accent" />
            Role permissions matrix
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <div key={role.key} className="rounded-xl border border-line p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">{role.label}</p>
                  <span className="text-[10px] text-muted">
                    {role.permissions.length} permissions
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
