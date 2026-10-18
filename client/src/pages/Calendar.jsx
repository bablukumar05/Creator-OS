import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { platforms } from '../../../shared/resources';
import { api } from '../services/api';
import { useData } from '../hooks/useData';
import { PageHeader, Button, ErrorState } from '../components/ui';
import { pathFor } from '../utils/format';
export default function Calendar() {
  const [month, setMonth] = useState(new Date()),
    [mode, setMode] = useState('month'),
    [platform, setPlatform] = useState(''),
    [status, setStatus] = useState('');
  const start = mode === 'month' ? startOfMonth(month) : startOfWeek(month, { weekStartsOn: 1 }),
    end = mode === 'month' ? endOfMonth(month) : endOfWeek(month, { weekStartsOn: 1 });
  const { data, error, refresh, loading } = useData(
    async () =>
      (
        await api.get('/calendar', {
          params: { from: start.toISOString(), to: end.toISOString(), platform, status },
        })
      ).data.data,
    [month, mode, platform, status],
  );
  const dates = eachDayOfInterval({
    start: mode === 'month' ? startOfWeek(start, { weekStartsOn: 1 }) : start,
    end: mode === 'month' ? endOfWeek(end, { weekStartsOn: 1 }) : end,
  });
  return (
    <>
      <PageHeader
        title="Content calendar"
        description="A little planning goes a long way. Find your creative rhythm."
      >
        <Link to="/content/new" className="btn btn-primary">
          <Plus size={15} />
          Schedule content
        </Link>
      </PageHeader>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{format(month, 'MMMM yyyy')}</h2>
            <button
              className="icon-btn h-8 w-8"
              aria-label="Previous period"
              onClick={() => setMonth(mode === 'month' ? subMonths(month, 1) : subWeeks(month, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="icon-btn h-8 w-8"
              aria-label="Next period"
              onClick={() => setMonth(mode === 'month' ? addMonths(month, 1) : addWeeks(month, 1))}
            >
              <ChevronRight size={16} />
            </button>
            <Button
              variant="secondary"
              className="min-h-8 px-3 py-1 text-xs"
              onClick={() => setMonth(new Date())}
            >
              Today
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="input w-auto text-xs"
              aria-label="Calendar platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">All platforms</option>
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              className="input w-auto text-xs"
              aria-label="Calendar status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All content statuses</option>
              {['Idea', 'Draft', 'Scheduled', 'Published'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="input w-auto text-xs"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              aria-label="Calendar view"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </div>
        </div>
        {error ? (
          <ErrorState error={error} retry={refresh} />
        ) : (
          <>
            <div className="hidden grid-cols-7 border-b border-line bg-canvas/60 md:grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div
                  key={d}
                  className="p-3 text-center text-[10px] uppercase tracking-wider text-muted"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-7">
              {dates.map((day) => {
                const events =
                  data?.filter(
                    (e) =>
                      format(new Date(e.eventDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'),
                  ) || [];
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-w-0 border-b border-r border-line p-2.5 md:min-h-[135px] ${!isSameMonth(day, month) && mode === 'month' ? 'hidden bg-canvas/70 opacity-50 md:block' : ''} ${!events.length ? 'hidden md:block' : ''}`}
                  >
                    <div className="mb-2 flex justify-between text-[11px]">
                      <span className="text-muted md:hidden">{format(day, 'EEEE')}</span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${isToday(day) ? 'bg-accent text-white dark:text-black' : 'text-muted'}`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    {events.map((event) => (
                      <Link
                        key={event._id}
                        to={`${pathFor(event.resource)}/${event._id}`}
                        className="mb-1.5 block rounded-md border-l-2 border-[#91a07e] bg-sage px-2 py-2"
                      >
                        <p className="line-clamp-2 text-[10px] font-medium leading-relaxed">
                          {event.title}
                        </p>
                        <p className="mt-1 text-[9px] text-muted">
                          {event.platform || event.resource}{' '}
                          {event.scheduledTime && `· ${event.scheduledTime}`}
                        </p>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
            {loading && <p className="p-4 text-xs text-muted">Loading your calendar...</p>}
            {!loading && !data?.length && (
              <p className="p-5 text-center text-xs text-muted">
                No scheduled items in this period. Make room for something new.
              </p>
            )}
          </>
        )}
      </div>
      <p className="mt-4 text-[10px] text-muted">
        Your content, tasks, campaign deadlines, and brand deliverables — together in one view.
      </p>
    </>
  );
}