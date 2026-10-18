import { models, Analytics, Activity } from '../models/resources.js';
import mongoose from 'mongoose';
import { audienceSeries } from './audienceService.js';
export const sum = (items, key = 'amount') =>
  items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
export const growth = (now, before) =>
  before ? Math.round(((now - before) / before) * 1000) / 10 : 0;
export async function dashboard(owner, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  const previous = new Date(cutoff);
  previous.setDate(previous.getDate() - days);
  const end = new Date();
  const scope = { owner, deletedAt: null };
  const [
    revenue,
    expenses,
    content,
    campaigns,
    tasks,
    deals,
    invoices,
    analytics,
    activity,
    baseline,
  ] = await Promise.all([
    models.revenue.find({ ...scope, date: { $gte: previous, $lte: end }, status: 'Paid' }).lean(),
    models.expenses.find({ ...scope, date: { $gte: previous, $lte: end } }).lean(),
    models.content.find(scope).lean(),
    models.campaigns.find(scope).lean(),
    models.tasks.find(scope).sort({ dueDate: 1 }).lean(),
    models.deals.find(scope).lean(),
    models.invoices.find(scope).lean(),
    Analytics.find({ ...scope, date: { $gte: cutoff, $lte: end } })
      .sort({ date: 1 })
      .lean(),
    Activity.find(scope).sort({ createdAt: -1 }).limit(6).lean(),
    Analytics.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(String(owner)),
          deletedAt: null,
          date: { $lt: cutoff },
        },
      },
      { $sort: { date: -1 } },
      { $group: { _id: '$platform', snapshot: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$snapshot' } },
    ]),
  ]);
  const current = revenue.filter((r) => r.date >= cutoff),
    old = revenue.filter((r) => r.date < cutoff),
    costs = expenses.filter((r) => r.date >= cutoff),
    points = analytics.filter((r) => r.date >= cutoff);
  const steps = days <= 7 ? 7 : days <= 90 ? 6 : 12;
  const { series: audience, latest } = audienceSeries(baseline, points, cutoff, end, steps);
  const followers = sum([...latest.values()], 'followers');
  const views = sum(points, 'views');
  const engagement = views
    ? ((sum(points, 'likes') +
        sum(points, 'comments') +
        sum(points, 'shares') +
        sum(points, 'saves')) /
        views) *
      100
    : 0;
  const buckets = new Map();
  for (let i = 0; i < steps; i++) {
    const date = new Date(cutoff.getTime() + (i * (end - cutoff)) / steps);
    buckets.set(i, {
      label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: 0,
      expenses: 0,
      views: 0,
      followers: 0,
      engagement: 0,
      count: 0,
    });
  }
  const bucket = (date) =>
    buckets.get(
      Math.min(
        steps - 1,
        Math.max(0, Math.floor(((new Date(date) - cutoff) / (end - cutoff)) * steps)),
      ),
    );
  for (const r of current) bucket(r.date).revenue += r.amount;
  for (const e of costs) bucket(e.date).expenses += e.amount;
  const series = [...buckets.values()].map((b, index) => ({
    ...b,
    ...audience[index],
  }));
  return {
    days,
    stats: {
      followers,
      followersGrowth: growth(followers, sum(baseline, 'followers')),
      revenue: sum(current),
      revenueGrowth: growth(sum(current), sum(old)),
      expenses: sum(costs),
      profit: sum(current) - sum(costs),
      content: content.filter((c) => c.createdAt >= cutoff && c.createdAt <= end).length,
      activeCampaigns: campaigns.filter((c) => c.status === 'Active').length,
      activeDeals: deals.filter((d) => d.status === 'Active').length,
      pendingTasks: tasks.filter((t) => !['Completed', 'Cancelled'].includes(t.status)).length,
      engagement: Number(engagement.toFixed(2)),
      views,
      averageDeal: deals.length ? sum(deals) / deals.length : 0,
      campaignCompletion: campaigns.length
        ? (campaigns.filter((c) => c.status === 'Completed').length / campaigns.length) * 100
        : 0,
      pendingPayments: sum(invoices.filter((i) => ['Sent', 'Overdue'].includes(i.status))),
      overdueInvoices: invoices.filter(
        (i) => !['Paid', 'Cancelled'].includes(i.status) && i.dueDate < end,
      ).length,
    },
    series,
    platforms: [...latest.values()].map((a) => ({
      platform: a.platform,
      followers: a.followers,
      views: sum(
        points.filter((p) => p.platform === a.platform),
        'views',
      ),
      revenue: sum(current.filter((r) => r.platform === a.platform)),
    })),
    upcomingContent: content
      .filter((c) => ['Scheduled', 'Draft'].includes(c.status))
      .sort((a, b) => new Date(a.publishDate || end) - new Date(b.publishDate || end))
      .slice(0, 4),
    topContent: content
      .filter((c) => c.status === 'Published')
      .sort((a, b) => b.views - a.views)
      .slice(0, 5),
    tasks: tasks.filter((t) => !['Completed', 'Cancelled'].includes(t.status)).slice(0, 4),
    deals: deals.filter((d) => d.status === 'Active').slice(0, 4),
    transactions: current.sort((a, b) => b.date - a.date).slice(0, 6),
    activity,
  };
}