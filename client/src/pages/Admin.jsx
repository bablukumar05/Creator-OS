import { useState } from 'react';
import { Users, Clapperboard, Flag, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, message } from '../services/api';
import { useData, useDebounce } from '../hooks/useData';
import { PageHeader, StatCard, Button, Loading, ErrorState, Badge, Modal } from '../components/ui';
import { date, initials } from '../utils/format';
export default function Admin() {
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [role, setRole] = useState(''),
    [active, setActive] = useState(''),
    [target, setTarget] = useState(null),
    [busy, setBusy] = useState(false);
  const debounced = useDebounce(search);
  const stats = useData(async () => (await api.get('/admin')).data.data, []);
  const users = useData(
    async () =>
      (await api.get('/admin/users', { params: { search: debounced, page, role, active } })).data
        .data,
    [debounced, page, role, active],
  );
  const change = async () => {
    setBusy(true);
    try {
      await api.patch(`/admin/users/${target._id}`, { isActive: !target.isActive });
      toast.success('Account status updated.');
      setTarget(null);
      users.refresh();
      stats.refresh();
    } catch (e) {
      toast.error(message(e));
    } finally {
      setBusy(false);
    }
  };
  if (stats.loading) return <Loading />;
  if (stats.error) return <ErrorState error={stats.error} retry={stats.refresh} />;
  return (
    <>
      <PageHeader
        title="Platform overview"
        description="A thoughtful view of the CreatorOS community."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total accounts"
          value={stats.data.users}
          detail="across your platform"
          icon={Users}
        />
        <StatCard
          label="Active creators"
          value={stats.data.active}
          detail="active creator accounts"
          icon={Shield}
        />
        <StatCard
          label="Content records"
          value={stats.data.content}
          detail="in creator workspaces"
          icon={Clapperboard}
        />
        <StatCard
          label="Campaigns"
          value={stats.data.campaigns}
          detail="across the platform"
          icon={Flag}
        />
      </div>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <h2 className="section-title">Creator accounts</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="input w-auto text-xs"
              placeholder="Search creators..."
              aria-label="Search creators"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="input w-auto text-xs"
              aria-label="Filter account role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className="input w-auto text-xs"
              aria-label="Filter account status"
              value={active}
              onChange={(e) => {
                setActive(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All accounts</option>
              <option value="true">Active</option>
              <option value="false">Suspended</option>
            </select>
          </div>
        </div>
        {users.error ? (
          <ErrorState error={users.error} retry={users.refresh} />
        ) : (
          users.data?.items.map((user) => (
            <div
              key={user._id}
              className="flex flex-wrap items-center gap-3 border-b border-line p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-xs text-accent">
                {initials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{user.name}</p>
                <p className="mt-1 break-all text-[10px] text-muted">{user.email}</p>
              </div>
              <span className="hidden text-xs capitalize text-muted sm:block">{user.role}</span>
              <Badge>{user.isActive ? 'Active' : 'Suspended'}</Badge>
              <Button
                variant="secondary"
                className="min-h-8 px-3 py-1 text-[10px]"
                disabled={user.role === 'admin'}
                onClick={() => setTarget(user)}
              >
                {user.isActive ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          ))
        )}
        <div className="flex items-center justify-between p-4 text-xs text-muted">
          <span>
            {users.data?.total || 0} accounts · Page {page}
          </span>
          <div className="flex gap-2">
            <button
              className="icon-btn disabled:opacity-30"
              aria-label="Previous user page"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              className="icon-btn disabled:opacity-30"
              aria-label="Next user page"
              disabled={page >= (users.data?.pages || 1)}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>
      <section className="card mt-6 p-6">
        <h2 className="section-title mb-4">Recent platform activity</h2>
        <div className="space-y-3">
          {stats.data.activity.slice(0, 10).map((item) => (
            <div
              key={item._id}
              className="flex justify-between gap-4 border-b border-line pb-3 text-xs last:border-0"
            >
              <p>{item.title}</p>
              <span className="shrink-0 text-[10px] text-muted">{date(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
      {target && (
        <Modal
          title={`${target.isActive ? 'Suspend' : 'Activate'} ${target.name}?`}
          onClose={() => setTarget(null)}
        >
          <p className="mb-6 text-sm text-muted">
            {target.isActive
              ? 'The creator will be signed out and unable to access their workspace until reactivated.'
              : 'The creator will be able to sign in again.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={change}>
              Confirm
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}