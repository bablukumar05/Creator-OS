import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserRound,
  Building2,
  Users,
  ShieldCheck,
  Bell,
  Palette,
  Link2,
  CreditCard,
  Check,
  ArrowUpRight,
  Mail,
  MapPin,
  Globe,
  LogOut,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useUI } from '../store';
import { OrganizationSettingsPanel } from '../features/organizations/components/OrganizationSettingsPanel';
import { TeamMembersPanel } from '../features/members/components/TeamMembersPanel';
import { api, message } from '../services/api';
import { useData } from '../hooks/useData';
import { PageHeader, Button, Loading, ErrorState, Modal } from '../components/ui';
import { initials } from '../utils/format';
import { platforms } from '../../../shared/resources';
const tabs = [
  ['personal', 'Personal information', UserRound],
  ['workspace', 'Organization', Building2],
  ['team', 'Team & roles', Users],
  ['security', 'Account & security', ShieldCheck],
  ['notifications', 'Notifications', Bell],
  ['social', 'Social accounts', Link2],
  ['appearance', 'Appearance', Palette],
  ['billing', 'Billing', CreditCard],
];
export default function Settings({ profilePage = false }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme, setCurrency } = useUI();
  const [tab, setTab] = useState('personal'),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false),
    [confirmation, setConfirmation] = useState('');
  const query = useData(async () => (await api.get('/profile')).data.data, []);
  const sessionsQuery = useData(async () => (await api.get('/auth/sessions')).data.data, []);
  const save = async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      if (tab === 'personal') {
        const account = (
          await api.patch('/auth/account', { name: values.name, avatar: values.avatar })
        ).data.data;
        await api.patch('/profile', {
          bio: values.bio,
          username: values.username,
          niche: values.niche,
          location: values.location,
          website: values.website,
          currency: values.currency,
        });
        setUser(account);
        setCurrency(values.currency);
      } else if (tab === 'social') {
        await api.patch('/profile', { socials: values });
      } else if (tab === 'security') {
        if (values.password !== values.confirmPassword)
          throw { response: { data: { message: 'Passwords do not match.' } } };
        await api.post('/auth/change-password', {
          currentPassword: values.currentPassword,
          password: values.password,
        });
        e.target.reset();
      }
      toast.success('Changes saved.');
      query.refresh();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };
  if (query.loading && !query.data) return <Loading />;
  if (query.error) return <ErrorState error={query.error} retry={query.refresh} />;
  const profile = query.data || {};
  const toggleNotifications = async () => {
    try {
      await api.patch('/profile', { notifications: !profile.notifications });
      query.refresh();
      toast.success('Notification preference saved.');
    } catch (e) {
      toast.error(message(e));
    }
  };
  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.delete('/auth/account', { data: { confirmation } });
      setUser(null);
      toast.success('Account deleted.');
    } catch (e) {
      toast.error(message(e));
    } finally {
      setBusy(false);
    }
  };
  const revokeSession = async (session) => {
    try {
      await api.delete(`/auth/sessions/${session._id}`);
      if (session.current) {
        setUser(null);
        navigate('/login', { replace: true });
      } else {
        sessionsQuery.refresh();
        toast.success('Session signed out.');
      }
    } catch (error) {
      toast.error(message(error));
    }
  };
  return (
    <>
      <PageHeader
        title={profilePage ? 'Your creator profile' : 'Make yourself at home'}
        description={
          profilePage
            ? 'The person behind the work. Tell your story.'
            : 'A few thoughtful details to make this workspace yours.'
        }
      />
      {profilePage && (
        <section className="card mb-6 overflow-hidden">
          <div className="h-32 bg-[#dbe4d0] dark:bg-[#35452f]" />
          <div className="relative px-6 pb-6">
            <div className="-mt-8 mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#edf1e6] text-2xl font-medium text-[#58704c] dark:border-[#202a22]">
              {user.avatar ? (
                <img
                  className="h-full w-full rounded-xl object-cover"
                  src={user.avatar}
                  alt="Your avatar"
                />
              ) : (
                initials(user.name)
              )}
            </div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="mt-1 text-xs text-muted">
              @{profile.username || 'creator'} · {profile.niche || 'Independent creator'}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {profile.bio || 'Add a bio below to tell your creative story.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Mail size={13} />
                {user.email}
              </span>
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <Globe size={13} />
                  Website
                  <ArrowUpRight size={12} />
                </a>
              )}
            </div>
          </div>
        </section>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="card flex flex-wrap gap-1 p-2 lg:flex-col">
          {tabs
            .filter((t) => !profilePage || ['personal', 'social'].includes(t[0]))
            .map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-3 rounded-lg p-3 text-left text-xs ${tab === key ? 'bg-sage font-medium text-accent' : 'text-muted hover:bg-canvas'}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
        </nav>
        <section className="card p-5 md:p-7">
          <h2 className="section-title mb-1">{tabs.find((t) => t[0] === tab)?.[1]}</h2>
          <p className="mb-6 text-xs text-muted">Keep your workspace in tune with you.</p>
          {['personal', 'social', 'security'].includes(tab) && (
            <form key={`${tab}-${profile.updatedAt}`} onSubmit={save} className="space-y-5">
              {tab === 'personal' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ['name', 'Full name', user.name],
                      ['username', 'Username', profile.username],
                      ['avatar', 'Avatar URL', user.avatar],
                      ['niche', 'Creative niche', profile.niche],
                      ['location', 'Location', profile.location],
                      ['timezone', 'Timezone', profile.timezone],
                      ['language', 'Language', profile.language],
                      ['website', 'Website', profile.website],
                    ].map(([key, label, value]) => (
                      <div key={key}>
                        <label className="label" htmlFor={key}>
                          {label}
                        </label>
                        <input
                          id={key}
                          name={key}
                          defaultValue={value || ''}
                          type={['website', 'avatar'].includes(key) ? 'url' : 'text'}
                          required={key === 'name'}
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="label" htmlFor="bio">
                      A little about you
                    </label>
                    <textarea
                      className="input"
                      rows={4}
                      name="bio"
                      id="bio"
                      defaultValue={profile.bio || ''}
                      maxLength={2000}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="currency">
                      Display currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      className="input max-w-xs"
                      defaultValue={profile.currency || 'INR'}
                    >
                      {['INR', 'USD', 'EUR', 'GBP'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-[10px] text-muted">
                      Changes formatting only. Existing amounts are not converted.
                    </p>
                  </div>
                  <div className="rounded-lg bg-canvas p-3 text-xs text-muted">
                    Verified email: {user.email}. Phone: {user.phone || 'Not added'}.
                  </div>
                </>
              ) : tab === 'social' ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-line bg-canvas flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-xs text-ink flex items-center gap-1.5">
                        <Radio size={14} className="text-[#2b5341]" /> Live Social Studio & Metrics Sync
                      </h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Connect real YouTube & Instagram channels, sync subscriber stats, and broadcast live posts.
                      </p>
                    </div>
                    <Link to="/social" className="btn btn-primary text-xs shrink-0">
                      Open Social Studio
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs leading-relaxed text-muted">
                      Public links displayed on your creator portfolio and rate cards:
                    </p>
                    {platforms.map((p) => (
                      <div key={p}>
                        <label className="label" htmlFor={`social-${p}`}>
                          {p}
                        </label>
                        <input
                          type="url"
                          id={`social-${p}`}
                          name={p}
                          className="input"
                          placeholder={`Your ${p} profile URL`}
                          defaultValue={profile.socials?.[p] || ''}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-md space-y-4">
                  {[
                    ['currentPassword', 'Current password'],
                    ['password', 'New password'],
                    ['confirmPassword', 'Confirm new password'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="label" htmlFor={key}>
                        {label}
                      </label>
                      <input
                        className="input"
                        id={key}
                        name={key}
                        type="password"
                        required
                        minLength={key === 'currentPassword' ? 1 : 8}
                        autoComplete={
                          key === 'currentPassword' ? 'current-password' : 'new-password'
                        }
                      />
                    </div>
                  ))}
                  <p className="text-[10px] text-muted">
                    Use 8+ characters with uppercase, lowercase, a number, and a symbol. Other
                    sessions will be signed out.
                  </p>
                </div>
              )}
              <div className="border-t border-line pt-5">
                <Button loading={busy}>Save changes</Button>
              </div>
            </form>
          )}
          {tab === 'workspace' && <OrganizationSettingsPanel />}
          {tab === 'team' && <TeamMembersPanel />}
          {tab === 'notifications' && (
            <div className="flex items-start justify-between gap-6 rounded-xl border border-line p-4">
              <div>
                <p className="text-sm font-medium">Deadline reminders</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Get in-app reminders for content, tasks, campaigns, deals, and invoices due within
                  24 hours.
                </p>
              </div>
              <button
                role="switch"
                aria-label="Deadline reminders"
                aria-checked={profile.notifications !== false}
                onClick={toggleNotifications}
                className={`flex h-6 w-11 shrink-0 rounded-full p-1 transition ${profile.notifications !== false ? 'justify-end bg-[#718965]' : 'bg-line'}`}
              >
                <span className="h-4 w-4 rounded-full bg-white" />
              </button>
            </div>
          )}
          {tab === 'appearance' && (
            <div className="grid max-w-xl grid-cols-2 gap-4">
              {['light', 'dark'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => theme !== mode && toggleTheme()}
                  className={`rounded-xl border-2 p-4 text-left ${theme === mode ? 'border-[#819969]' : 'border-line'}`}
                >
                  <div
                    className={`mb-3 flex h-24 gap-2 rounded-lg p-2 ${mode === 'light' ? 'bg-[#f4f5ef]' : 'bg-[#1b241d]'}`}
                  >
                    <div
                      className={`w-1/4 rounded ${mode === 'light' ? 'bg-white' : 'bg-[#304033]'}`}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded bg-[#a5b096]/30" />
                      <div className="h-12 rounded bg-[#a5b096]/20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs capitalize">
                    {mode} mode {theme === mode && <Check size={14} />}
                  </div>
                </button>
              ))}
            </div>
          )}
          {tab === 'billing' && (
            <div className="rounded-xl bg-canvas p-6">
              <span className="badge bg-sage text-accent">Self-hosted workspace</span>
              <h3 className="mt-4 text-xl font-semibold">Your tools. Your infrastructure.</h3>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
                All application modules are included. Hosting, database, email, and media storage
                are managed separately with your service providers. There are no active subscription
                payments in this installation.
              </p>
            </div>
          )}
          {tab === 'security' && (
            <div className="mt-10 border-t border-line pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium">Active sessions</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Sign out devices you no longer use. Your current session stays marked here.
                  </p>
                </div>
                <button
                  className="text-xs text-accent underline"
                  onClick={sessionsQuery.refresh}
                  type="button"
                >
                  Refresh
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {sessionsQuery.loading && <p className="text-xs text-muted">Loading sessions…</p>}
                {sessionsQuery.data?.items?.map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-line p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {session.browser} · {session.device}
                        {session.current && <span className="ml-2 text-accent">Current device</span>}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">
                        Last active {new Date(session.lastUsedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="icon-btn shrink-0 text-[#a16a5e]"
                      aria-label={`Sign out ${session.browser}`}
                      onClick={() => revokeSession(session)}
                      type="button"
                    >
                      <LogOut size={15} />
                    </button>
                  </div>
                ))}
                {!sessionsQuery.loading && !sessionsQuery.data?.items?.length && (
                  <p className="text-xs text-muted">No active sessions found.</p>
                )}
              </div>
            </div>
          )}
          {tab === 'security' && (
            <div className="mt-10 border-t border-line pt-6">
              <h3 className="text-sm font-medium">Delete your account</h3>
              <p className="my-3 text-xs leading-relaxed text-muted">
                Permanently remove your account and workspace records. This cannot be undone.
              </p>
              <Button
                variant="secondary"
                className="text-[#a16a5e]"
                onClick={() => setDeleting(true)}
              >
                Delete account
              </Button>
            </div>
          )}
        </section>
      </div>
      {deleting && (
        <Modal title="Permanently delete your account?" onClose={() => setDeleting(false)}>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            All your workspace data will be deleted. Type DELETE to confirm.
          </p>
          <input
            className="input mb-5"
            aria-label="Deletion confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleting(false)}>
              Keep my account
            </Button>
            <Button loading={busy} disabled={confirmation !== 'DELETE'} onClick={deleteAccount}>
              Delete permanently
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}