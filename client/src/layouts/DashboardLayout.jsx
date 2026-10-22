import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clapperboard,
  CalendarDays,
  BriefcaseBusiness,
  Handshake,
  Flag,
  ListTodo,
  Wallet,
  ReceiptText,
  FileText,
  ChartNoAxesCombined,
  Images,
  Bell,
  Settings,
  Search,
  Plus,
  Sun,
  Moon,
  Menu,
  LogOut,
  ChevronRight,
  Command,
  Sparkles,
  Users,
  Shield,
  ShieldCheck,
  Radio,
  Video,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth, useOrganization, useUI } from '../store';
import { WorkspaceSwitcher } from '../features/organizations/components/WorkspaceSwitcher';
import { api, service, message } from '../services/api';
import { useDebounce, useData } from '../hooks/useData';
import { Logo, Modal } from '../components/ui';
import { initials, pathFor } from '../utils/format';
import { PageBackground } from '../components/ui';
const groups = [
  {
    title: 'WORKSPACE',
    items: [
      ['/dashboard', 'Overview', LayoutDashboard],
      ['/content', 'Content planner', Clapperboard],
      ['/review-studio', 'Review Studio', Video],
      ['/social', 'Social Studio', Radio],
      ['/ai-studio', 'AI Studio', Sparkles],
      ['/calendar', 'Calendar', CalendarDays],
      ['/analytics', 'Analytics', ChartNoAxesCombined],
      ['/u/creator', 'Media Kit', Globe],
    ],
  },
  {
    title: 'MARKETPLACE',
    items: [
      ['/marketplace', 'Creator discovery', Sparkles],
      ['/talent', 'Talent roster', Users],
    ],
  },
  {
    title: 'YOUR BUSINESS',
    items: [
      ['/brands', 'Brands', BriefcaseBusiness],
      ['/deals', 'Brand deals', Handshake],
      ['/campaigns', 'Campaigns', Flag],
      ['/tasks', 'Tasks', ListTodo],
    ],
  },
  {
    title: 'MANAGE',
    items: [
      ['/finance/revenue', 'Revenue', Wallet],
      ['/finance/expenses', 'Expenses', ReceiptText],
      ['/invoices', 'Invoices', FileText],
      ['/escrow', 'Escrow Vault', ShieldCheck],
      ['/media', 'Media library', Images],
      ['/notifications', 'Notifications', Bell],
    ],
  },
];
export default function DashboardLayout() {
  const { user, config, logout } = useAuth();
  const currentOrganization = useOrganization((s) => s.currentOrganization);
  const { theme, toggleTheme, setCurrency } = useUI();
  const location = useLocation(),
    navigate = useNavigate();
  const [open, setOpen] = useState(false),
    [mobileSearch, setMobileSearch] = useState(false),
    [query, setQuery] = useState(''),
    [quick, setQuick] = useState(false),
    [notifications, setNotifications] = useState(false);
  const debounced = useDebounce(query);
  const search = useData(
    () => (debounced.length > 1 ? service.search(debounced) : Promise.resolve([])),
    [debounced, currentOrganization?._id],
  );
  const unread = useData(
    async () => (await api.get('/notifications/unread')).data.data,
    [currentOrganization?._id],
  );
  const notices = useData(
    () => service.list('notifications', { limit: 4 }),
    [notifications, currentOrganization?._id],
  );
  useEffect(() => {
    setOpen(false);
    setMobileSearch(false);
    setQuick(false);
    setNotifications(false);
    setQuery('');
  }, [location.pathname]);
  useEffect(() => {
    api
      .get('/profile')
      .then((r) => setCurrency(r.data.data?.currency || 'INR'))
      .catch(() => {});
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('creatoros_token') : null;
    const socket = io(
      import.meta.env.VITE_API_URL?.startsWith('http')
        ? new URL(import.meta.env.VITE_API_URL).origin
        : undefined,
      { withCredentials: true, auth: { token } },
    );
    socket.on('notification', (notice) => {
      toast(notice.title);
      unread.refresh();
      notices.refresh();
    });
    socket.on('payment-received', (data) => {
      toast.success(`Payment of ${data.amount ? `₹${data.amount}` : ''} received for Invoice #${data.invoiceNumber || ''}!`, {
        duration: 6000,
      });
      unread.refresh();
      notices.refresh();
    });
    socket.on('social-channel-synced', (data) => {
      toast.success(`${data.platform?.toUpperCase() || 'Social'} @${data.accountHandle || ''} synced with latest metrics!`);
    });
    socket.on('social-post-published', (data) => {
      toast.success(`Post broadcasted to ${data.post?.platform || 'channel'}!`);
    });
    socket.on('contract-signed', (data) => {
      toast.success(`Contract "${data.title}" counter-signed by ${data.signedBy}!`, {
        duration: 6000,
      });
      unread.refresh();
      notices.refresh();
    });
    socket.on('review-created', (data) => {
      toast(`New review note at ${data.timecodeFormatted}: "${data.comment?.slice(0, 40)}..."`);
    });
    socket.on('sponsorship-inquiry', (data) => {
      toast.success(
        `New Sponsorship Brief from ${data.brandName}! Budget: ${data.budget ? `₹${Number(data.budget).toLocaleString()}` : 'Negotiable'}`,
        { duration: 8000 },
      );
      unread.refresh();
      notices.refresh();
    });
    return () => socket.disconnect();
  }, []);
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setMobileSearch(false);
        setQuick(false);
        setNotifications(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const page = location.pathname.split('/').filter(Boolean).pop();
  const current =
    groups.flatMap((g) => g.items).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    (page === 'admin'
      ? 'Administration'
      : page === 'profile'
        ? 'My profile'
        : page === 'settings'
          ? 'Settings'
          : 'Workspace');
  const signOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      toast.error(message(e));
    }
  };
  return (
    <div className="min-h-screen bg-canvas">
      {open && (
        <button
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[228px] flex-col border-r border-line bg-white transition-transform dark:bg-[#1b241d] ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <Link to="/dashboard" className="px-6 pb-6 pt-7">
          <Logo />
        </Link>
        <WorkspaceSwitcher />
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3">
          {groups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="eyebrow mb-2 px-3 text-[9px]">{group.title}</p>
              {group.items.map(([path, label, Icon]) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] transition-colors ${isActive ? 'bg-sage font-semibold text-accent' : 'text-[#777f75] hover:bg-canvas dark:text-muted'}`
                  }
                >
                  <Icon size={16} strokeWidth={1.6} />
                  {label}
                  {path === '/calendar' && (
                    <span className="ml-auto text-[9px]">{new Date().getDate()}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
          {user.role === 'admin' && (
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-accent"
            >
              <Shield size={16} />
              Administration
            </NavLink>
          )}
        </nav>
        <div className="mx-4 mb-4 rounded-xl bg-[#f3f5ed] p-3.5 dark:bg-[#28362c]">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8ca775]" />
            {config.demo ? 'Your creative playground' : 'A little space to focus'}
          </div>
          <p className="text-[10px] leading-relaxed text-muted">
            {config.demo
              ? 'Explore with sample data. This demo resets when the server restarts.'
              : 'One workspace. ,ore room for your best ideas.'}
          </p>
        </div>
        <div className="border-t border-line p-3">
          <NavLink
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted hover:bg-canvas"
          >
            <Settings size={16} />
            Settings
          </NavLink>
          <div className="mt-2 flex items-center gap-2 px-2 py-2">
            <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce4d4] text-[11px] font-semibold text-[#526747]">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold">{user.name}</p>
                <p className="text-[10px] capitalize text-muted">{user.role} account</p>
              </div>
            </Link>
            <button
              className="icon-btn h-8 w-8"
              title="Sign out"
              aria-label="Sign out"
              onClick={signOut}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 lg:ml-[228px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between gap-2 border-b border-line bg-white/95 px-4 backdrop-blur-md dark:bg-[#1b241d]/95 md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="icon-btn lg:hidden"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="hidden text-[11px] text-muted sm:block">Workspace</span>
            <ChevronRight size={12} className="hidden text-muted sm:block" />
            <span className="truncate text-[11px] font-medium">{current}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <button
              className="icon-btn h-9 w-9 md:hidden"
              aria-label="Open workspace search"
              onClick={() => setMobileSearch(true)}
            >
              <Search size={17} />
            </button>
            <div className="relative hidden md:block">
              <div className="flex w-[220px] items-center gap-2 rounded-lg border border-line bg-canvas/70 px-3 py-2">
                <Search size={14} className="text-muted" />
                <input
                  id="global-search"
                  aria-label="Search workspace"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anything..."
                  className="w-full min-w-0 bg-transparent text-[11px] outline-none"
                />
                <span className="flex gap-0.5 text-[9px] text-muted">
                  <Command size={10} />K
                </span>
              </div>
              {query.length > 1 && (
                <div className="card absolute right-0 top-12 max-h-96 w-80 overflow-auto p-2 shadow-lg">
                  {search.loading ? (
                    <p className="p-4 text-xs text-muted">Searching...</p>
                  ) : search.data?.length ? (
                    search.data.map((item) => (
                      <Link
                        to={`${pathFor(item.resource)}/${item._id}`}
                        key={item._id}
                        className="block rounded-lg p-3 hover:bg-canvas"
                      >
                        <p className="text-xs font-medium">{item.title}</p>
                        <p className="mt-1 text-[10px] text-muted">{item.label}</p>
                      </Link>
                    ))
                  ) : (
                    <p className="p-4 text-xs text-muted">No results for “{query}”</p>
                  )}
                </div>
              )}
            </div>
            <button
              className="icon-btn h-9 w-9"
              title="Toggle appearance"
              aria-label="Toggle appearance"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="relative">
              <button
                className="icon-btn relative h-9 w-9"
                aria-label="Notifications"
                aria-expanded={notifications}
                onClick={() => {
                  setNotifications(!notifications);
                  setQuick(false);
                }}
              >
                <Bell size={17} />
                {unread.data?.count > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full border border-white bg-[#8fa273]" />
                )}
              </button>
              {notifications && (
                <div className="card absolute right-0 top-12 w-[280px] max-w-[calc(100vw-32px)] p-2 shadow-lg">
                  <div className="flex items-center justify-between p-2">
                    <p className="text-xs font-semibold">Your notifications</p>
                    <span className="badge bg-sage">{unread.data?.count || 0} new</span>
                  </div>
                  {notices.data?.items.map((n) => (
                    <Link
                      to="/notifications"
                      key={n._id}
                      className="block border-t border-line p-3 text-xs"
                    >
                      <p className="font-medium">{n.title}</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-muted">{n.description}</p>
                    </Link>
                  ))}
                  <Link
                    to="/notifications"
                    className="block rounded-lg bg-canvas p-2 text-center text-xs"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
            <Link
              to={`/u/${user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'creator'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary hidden min-h-9 items-center gap-1.5 px-3 py-2 text-[11px] sm:inline-flex"
              title="Open Public Media Kit"
            >
              <Globe size={13} />
              <span>Media Kit</span>
              <ExternalLink size={11} className="text-muted" />
            </Link>
            <div className="relative">
              <button
                className="btn btn-primary min-h-9 px-3 py-2 text-[11px]"
                aria-expanded={quick}
                onClick={() => {
                  setQuick(!quick);
                  setNotifications(false);
                }}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Create new</span>
                <span className="sr-only sm:hidden">Create new</span>
              </button>
              {quick && (
                <div className="card absolute right-0 top-12 w-48 max-w-[calc(100vw-32px)] p-2 shadow-lg">
                  {['content', 'campaigns', 'deals', 'tasks', 'revenue', 'invoices'].map((key) => (
                    <Link
                      key={key}
                      to={`${pathFor(key)}/new`}
                      className="flex items-center gap-2 rounded-lg p-2.5 text-xs capitalize hover:bg-canvas"
                    >
                      <Plus size={13} />
                      {key === 'deals' ? 'Brand deal' : key}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        {mobileSearch && (
          <Modal title="Search your workspace" onClose={() => setMobileSearch(false)}>
            <input
              className="input"
              aria-label="Mobile workspace search"
              placeholder="Search content, brands, tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="mt-4 space-y-2">
              {search.data?.map((item) => (
                <Link
                  className="block rounded-lg bg-canvas p-3"
                  key={item._id}
                  to={`${pathFor(item.resource)}/${item._id}`}
                >
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="mt-1 text-[10px] text-muted">{item.label}</p>
                </Link>
              ))}
              {debounced.length > 1 && !search.loading && !search.data?.length && (
                <p className="text-xs text-muted">No matches found.</p>
              )}
            </div>
          </Modal>
        )}
        <main className="relative isolate mx-auto max-w-[1640px] w-full min-w-0 p-3 sm:p-5 md:p-8 pb-12 overflow-x-hidden">
          <PageBackground page={page} />
          <Outlet key={currentOrganization?._id || 'default'} />
        </main>
        <footer className="mx-4 flex justify-between gap-4 border-t border-line py-5 text-[10px] text-muted md:mx-8">
          <span>© {new Date().getFullYear()} CreatorOS</span>
          <span>Made for the way you create.</span>
        </footer>
      </div>
    </div>
  );
}