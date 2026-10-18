import { Link } from 'react-router-dom';
import { ArrowUpRight, Activity } from 'lucide-react';
import { Badge } from '../ui';
import { money, date } from '../../utils/format';
export default function RecentBusiness({ transactions, activity }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
      <section className="card p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="section-title">Recent transactions</h2>
          <Link to="/finance/revenue" className="flex items-center gap-1 text-[10px] text-muted">
            All income
            <ArrowUpRight size={13} />
          </Link>
        </div>
        {transactions.length ? (
          transactions.slice(0, 4).map((item) => (
            <Link
              key={item._id}
              to={`/finance/revenue/${item._id}`}
              className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{item.title}</p>
                <p className="mt-1 text-[10px] text-muted">
                  {item.category} · {date(item.date, 'dd MMM')}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold">{money(item.amount)}</span>
              <span className="hidden sm:block">
                <Badge>{item.status}</Badge>
              </span>
            </Link>
          ))
        ) : (
          <p className="py-5 text-xs text-muted">Paid income in this period will appear here.</p>
        )}
      </section>
      <section className="card p-5 md:p-6">
        <h2 className="section-title mb-5">Around your workspace</h2>
        {activity.length ? (
          activity.slice(0, 4).map((item) => (
            <div key={item._id} className="flex gap-3 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-accent">
                <Activity size={12} />
              </span>
              <div>
                <p className="text-[11px] leading-relaxed">{item.title}</p>
                <p className="mt-1 text-[10px] text-muted">
                  {date(item.createdAt, 'dd MMM, HH:mm')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-5 text-xs text-muted">
            Your workspace activity will appear here as you create.
          </p>
        )}
      </section>
    </div>
  );
}