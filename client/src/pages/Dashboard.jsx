import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Wallet,
  Clapperboard,
  TrendingUp,
  ArrowUpRight,
  Download,
  Plus,
  Check,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../store';
import { useData } from '../hooks/useData';
import { service, message } from '../services/api';
import {
  Button,
  PageHeader,
  StatCard,
  DateFilter,
  Loading,
  ErrorState,
  Badge,
  Empty,
} from '../components/ui';
import { RevenueChart, PlatformChart } from '../components/charts';
import RecentBusiness from '../components/dashboard/RecentBusiness';
import { money, number, date, exportCSV } from '../utils/format';
export default function Dashboard() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const { data, loading, error, refresh } = useData(() => service.dashboard(days), [days]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} retry={refresh} />;
  if (!data) return null;
  const { stats } = data;
  const complete = async (task) => {
    try {
      await service.update('tasks', task._id, { status: 'Completed' });
      toast.success('One less thing on your list.');
      refresh();
    } catch (e) {
      toast.error(message(e));
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${(user?.name || 'Creator').split(' ')[0]} ☀`}
        description="Here’s what’s happening with your creative business today."
      >
        <Button variant="secondary" onClick={() => exportCSV(data.series, 'overview')}>
          <Download size={14} />
          Export report
        </Button>
        <DateFilter value={days} onChange={setDays} />
      </PageHeader>
      <section className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-[#dfe7d5] bg-[#edf2e5] px-6 py-5 dark:border-line dark:bg-[#29382b]">
        <div className="relative z-10 flex items-start gap-4">
          <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#d5dfcb] bg-white/60 text-[#788762] sm:flex">
            <TrendingUp size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Your next chapter looks good.</p>
            <p className="mt-1.5 text-xs text-muted">
              {stats.activeCampaigns ? (
                <>
                  You have{' '}
                  <strong className="font-medium text-ink">
                    {stats.activeCampaigns} active campaigns
                  </strong>{' '}
                  and <strong className="font-medium text-ink">{stats.pendingTasks} tasks</strong>{' '}
                  to keep your momentum going.
                </>
              ) : (
                'A fresh workspace for your ideas, collaborations, and everything in between.'
              )}
            </p>
          </div>
        </div>
        <Link
          to="/tasks"
          className="relative z-10 flex items-center gap-2 text-[11px] font-semibold text-accent"
        >
          Let’s make it happen
          <ArrowUpRight size={15} />
        </Link>
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-24 h-64 w-64 rounded-full border-[22px] border-[#dfe8d1]/50 dark:border-white/5"
        />
      </section>
      <section
        className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-5"
        aria-label="Business overview"
      >
        <StatCard
          label="Total followers"
          value={number(stats.followers)}
          change={stats.followersGrowth}
          icon={Users}
        />
        <StatCard
          label="Total revenue"
          value={money(stats.revenue)}
          change={stats.revenueGrowth}
          icon={Wallet}
        />
        <StatCard
          label="Content created"
          value={stats.content}
          detail={`in the last ${days} days`}
          icon={Clapperboard}
        />
        <StatCard
          label="Engagement rate"
          value={`${stats.engagement}%`}
          detail="across your platforms"
          icon={TrendingUp}
        />
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <section className="card p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="section-title">Revenue overview</h2>
              <p className="mt-1.5 text-[11px] text-muted">
                A little perspective on your progress.
              </p>
            </div>
            <Link className="icon-btn h-7 w-7" to="/finance/revenue" aria-label="Open revenue">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mb-2 mt-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[28px] font-semibold tracking-[-1px]">{money(stats.revenue)}</p>
              <p className="mt-1 text-[10px] text-muted">Total earnings this period</p>
            </div>
            <div className="flex gap-4 text-[10px] text-muted">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[#819969]" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-[#c6c9bf]" />
                Expenses
              </span>
            </div>
          </div>
          <RevenueChart data={data.series} />
        </section>
        <section className="card p-5 md:p-6">
          <div className="flex justify-between">
            <div>
              <h2 className="section-title">Your audience</h2>
              <p className="mt-1.5 text-[11px] text-muted">A community you’ve made your own.</p>
            </div>
            <Link to="/analytics" className="icon-btn h-7 w-7" aria-label="Open analytics">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          {data.platforms.length ? (
            <PlatformChart data={data.platforms} total={stats.followers} />
          ) : (
            <Empty
              title="Your audience starts here"
              description="Analytics will appear when platform data is imported."
            />
          )}
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 md:px-6">
            <div>
              <h2 className="section-title">Next on your content calendar</h2>
              <p className="mt-1.5 text-[11px] text-muted">Good ideas, ready for their moment.</p>
            </div>
            <Link
              to="/content"
              className="flex items-center gap-1.5 text-[10px] font-medium text-muted"
            >
              View all
              <ArrowUpRight size={13} />
            </Link>
          </div>
          {data.upcomingContent.length ? (
            <>
              <div className="hidden grid-cols-[1fr_100px_100px] gap-4 border-y border-line bg-canvas/60 px-6 py-3 text-[9px] uppercase tracking-wider text-muted sm:grid">
                <span>Content</span>
                <span>Publish date</span>
                <span>Status</span>
              </div>
              {data.upcomingContent.map((item) => (
                <Link
                  to={`/content/${item._id}`}
                  key={item._id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 transition hover:bg-canvas/60 last:border-0 sm:grid-cols-[1fr_100px_100px] md:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      className="h-11 w-12 shrink-0 rounded-lg bg-canvas object-cover"
                      src={item.thumbnail}
                      alt=""
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-[11px] font-medium">{item.title}</h3>
                      <p className="mt-1 text-[10px] text-muted">
                        {item.platform}
                        <span className="px-1.5">·</span>
                        {item.type}
                      </p>
                    </div>
                  </div>
                  <div className="hidden text-[10px] sm:block">
                    <p>{date(item.publishDate, 'dd MMM')}</p>
                    <p className="mt-1 text-muted">{item.scheduledTime || 'All day'}</p>
                  </div>
                  <div>
                    <Badge>{item.status}</Badge>
                  </div>
                </Link>
              ))}
            </>
          ) : (
            <Empty
              title="Your next idea belongs here"
              action={
                <Link to="/content/new" className="btn btn-primary">
                  Create content
                </Link>
              }
            />
          )}
        </section>
        <section className="card flex flex-col p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">On your to-do list</h2>
            <Link to="/tasks" className="text-[10px] text-muted">
              View all <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">Small steps. Big things.</p>
          <div className="mt-5 flex-1">
            {data.tasks.length ? (
              data.tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex gap-3 border-b border-line py-3.5 first:pt-0 last:border-0"
                >
                  <button
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#d8ded3] text-transparent hover:bg-sage hover:text-accent"
                    aria-label={`Complete ${task.title}`}
                    onClick={() => complete(task)}
                  >
                    <Check size={12} />
                  </button>
                  <Link to={`/tasks/${task._id}`} className="min-w-0">
                    <h3 className="text-[11px] font-medium leading-relaxed">{task.title}</h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[9px] text-muted">
                      <CalendarDays size={10} />
                      {date(task.dueDate, 'dd MMM')}
                      <span>·</span>
                      <span>{task.priority} priority</span>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p className="py-6 text-xs text-muted">
                You’re all caught up. Enjoy a little breathing room.
              </p>
            )}
          </div>
          <Link to="/tasks/new" className="mt-3 flex items-center gap-2 text-[11px] text-muted">
            <Plus size={14} />
            Add a task
          </Link>
        </section>
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="section-title">Partnerships in motion</h2>
            <p className="mt-1 text-[11px] text-muted">Building good things, together.</p>
          </div>
          <Link to="/deals" className="flex items-center gap-1 text-[10px] text-muted">
            All brand deals
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.deals.slice(0, 3).map((deal) => (
            <Link
              key={deal._id}
              to={`/deals/${deal._id}`}
              className="card p-5 transition hover:border-[#a8b69e]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas text-lg font-semibold">
                  {deal.title[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-medium">{deal.title}</h3>
                  <p className="mt-1 text-[10px] text-muted">Brand collaboration</p>
                </div>
                <ArrowUpRight size={14} className="ml-auto shrink-0 text-muted" />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-base font-semibold">{money(deal.amount)}</p>
                <Badge>{deal.status}</Badge>
              </div>
              <div className="mt-4 flex justify-between border-t border-line pt-3 text-[10px] text-muted">
                <span>Due {date(deal.deadline, 'dd MMM')}</span>
                <span>{deal.paymentStatus} payment</span>
              </div>
            </Link>
          ))}
          {!data.deals.length && (
            <div className="card col-span-full">
              <Empty
                title="Your next partnership starts here"
                action={
                  <Link className="btn btn-primary" to="/deals/new">
                    Add a brand deal
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </section>
      <RecentBusiness transactions={data.transactions} activity={data.activity} />
    </div>
  );
}