import { useEffect, useRef } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Inbox,
  RefreshCw,
  Loader2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { message } from '../services/api';
import { motion, useReducedMotion } from 'framer-motion';
export function Logo({ small = false, light = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${light ? 'text-white' : 'text-ink'}`}>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${light ? 'bg-white/15' : 'bg-[#2b5341]'}`}
      >
        <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
          <path
            d="M29 9H18a11 11 0 0 0 0 22h11M12 20h16"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!small && (
        <span className="text-[20px] font-semibold tracking-[-.8px]">
          Creator<span className="font-normal">OS</span>
        </span>
      )}
    </div>
  );
}
export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      className={`btn btn-${variant} ${className}`}
      disabled={loading || props.disabled}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
export function Badge({ children }) {
  const green = ['Published', 'Paid', 'Completed', 'Active', 'Approved'].includes(children);
  const amber = [
    'Scheduled',
    'Pending',
    'In Progress',
    'Negotiating',
    'Overdue',
    'High',
    'Urgent',
  ].includes(children);
  return (
    <span
      className={`badge ${green ? 'bg-[#eaf2e8] text-[#486447] dark:bg-[#2b4130] dark:text-[#bbd1b3]' : amber ? 'bg-[#f5f0e4] text-[#8d7543] dark:bg-[#423d2d] dark:text-[#d7c396]' : 'bg-canvas text-muted'}`}
    >
      <span
        className={`h-1 w-1 rounded-full ${green ? 'bg-[#789370]' : amber ? 'bg-[#b49b62]' : 'bg-[#a0a69c]'}`}
      />
      {children}
    </span>
  );
}
export function StatCard({ label, value, change, icon: Icon, detail, spark = false }) {
  return (
    <div className="card min-w-0 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        {Icon && <Icon size={15} className="text-muted" strokeWidth={1.6} />}
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-[20px] sm:text-[24px] lg:text-[27px] font-semibold leading-none tracking-[-1px] truncate">{value}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
            {change != null ? (
              <span
                className={`flex items-center font-medium ${change >= 0 ? 'text-[#64815a] dark:text-[#aec6a4]' : 'text-[#a77d54]'}`}
              >
                {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{' '}
                {Math.abs(change)}%
              </span>
            ) : null}
            <span className="text-muted">{detail || 'vs. previous period'}</span>
          </div>
        </div>
        {spark && (
          <svg width="65" height="32" viewBox="0 0 65 32" className="shrink-0" aria-hidden="true">
            <path
              d="M1 30 L10 25 17 27 24 17 31 20 38 10 45 13 52 5 64 2"
              stroke="#96ad85"
              strokeWidth="1.6"
              fill="none"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
export function PageHeader({ title, description, children }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-7 flex flex-wrap items-center justify-between gap-4"
    >
      <div>
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="mt-2 text-xs leading-relaxed text-muted sm:text-[13px]">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </motion.div>
  );
}
export function Empty({
  title = 'A fresh start',
  description = 'Add your first record and make this space your own.',
  action,
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage text-accent">
        <Inbox size={22} strokeWidth={1.5} />
      </span>
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mb-5 mt-2 max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div className="card p-8 text-center" role="alert">
      <p className="mb-4 text-sm">{message(error)}</p>
      <Button variant="secondary" onClick={retry}>
        <RefreshCw size={14} />
        Try again
      </Button>
    </div>
  );
}
export const ErrorView = ErrorState;
export function Loading() {
  return (
    <div className="space-y-5 animate-pulse" aria-label="Loading" role="status">
      <div className="h-9 w-48 rounded-lg bg-line" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-line/50" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-line/40" />
    </div>
  );
}
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const handler = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#182019]/40 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`card max-h-[90dvh] w-full overflow-auto shadow-2xl outline-none ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4 dark:bg-[#202a22]">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button className="icon-btn" aria-label="Close dialog" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}
export function DateFilter({ value, onChange }) {
  return (
    <label className="relative">
      <span className="sr-only">Date range</span>
      <select
        className="btn btn-secondary appearance-none pr-9"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {[
          [7, 'Last 7 days'],
          [30, 'Last 30 days'],
          [90, 'Last 3 months'],
          [180, 'Last 6 months'],
          [365, 'Last year'],
        ].map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-3 top-3.5 text-muted" />
    </label>
  );
}
export function CheckRow({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
export function Success({ children }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-sage p-3 text-xs text-accent">
      <Check size={16} />
      {children}
    </div>
  );
}
const workspaceBg = '/images/backgrounds/workspace.webp';
const cameraBg = '/images/backgrounds/camera.webp';
const planningBg = '/images/backgrounds/planning.webp';
export const pageBackgrounds = {
  dashboard: workspaceBg,
  content: cameraBg,
  calendar: planningBg,
  brands: workspaceBg,
  deals: planningBg,
  campaigns: planningBg,
  tasks: planningBg,
  revenue: planningBg,
  expenses: planningBg,
  invoices: planningBg,
  analytics: workspaceBg,
  media: cameraBg,
  notifications: planningBg,
  profile: workspaceBg,
  settings: workspaceBg,
  admin: workspaceBg,
  auth: workspaceBg,
};
export function PageBackground({ page = 'dashboard', className = '' }) {
  return (
    <div aria-hidden="true" className={`page-decoration ${className}`}>
      <img
        src={pageBackgrounds[page] || workspaceBg}
        alt=""
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
