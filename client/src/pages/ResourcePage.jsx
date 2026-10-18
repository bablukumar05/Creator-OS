import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Copy,
  Pencil,
  Trash2,
  CalendarDays,
  Check,
  Image,
  Upload,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CloudStorageUploader from '../features/assets/components/CloudStorageUploader';
import { resources, platforms } from '../../../shared/resources';
import { api, service, message, downloadInvoice } from '../services/api';
import { memberApi } from '../features/members/api/memberApi';
import { useData, useDebounce } from '../hooks/useData';
import {
  PageHeader,
  Button,
  Badge,
  Empty,
  ErrorState,
  Loading,
  Modal,
  StatCard,
} from '../components/ui';
import ResourceForm from '../components/ResourceForm';
import RelatedRecords from '../components/RelatedRecords';
import UploadPreview from '../components/UploadPreview';
import ArchivedRecords from '../components/ArchivedRecords';
import { money, date, pathFor, exportCSV } from '../utils/format';
function Detail({ resource, record, onEdit, onDelete, onDuplicate }) {
  const config = resources[resource];
  return (
    <div className="space-y-5">
      {record.thumbnail && (
        <img
          src={record.thumbnail}
          alt={record.title}
          className="h-44 w-full rounded-xl object-cover"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {record.status && <Badge>{record.status}</Badge>}
        {record.platform && <span className="badge bg-canvas">{record.platform}</span>}
        {record.number && <span className="badge bg-canvas">{record.number}</span>}
      </div>
      <h3 className="text-xl font-semibold tracking-tight">{record.title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {config.fields
          .filter(
            (f) =>
              !['title', 'thumbnail', 'status', 'platform', 'items'].includes(f.key) &&
              record[f.key] != null &&
              record[f.key] !== '' &&
              f.type !== 'relation',
          )
          .map((f) => (
            <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <p className="eyebrow mb-1">{f.label}</p>
              <p className="whitespace-pre-wrap break-words text-sm">
                {f.type === 'date'
                  ? date(record[f.key])
                  : f.type === 'checkbox'
                    ? record[f.key]
                      ? 'Yes'
                      : 'No'
                    : String(record[f.key])}
              </p>
            </div>
          ))}
      </div>
      {resource === 'brands' && Array.isArray(record.contacts) && record.contacts.length > 0 && (
        <div className="space-y-2 rounded-xl bg-canvas p-4">
          <p className="eyebrow">Brand contacts</p>
          {record.contacts.map((c, i) => (
            <div key={c._id || i} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium">
                {c.name}
                {c.role ? ` · ${c.role}` : ''}
              </span>
              <span className="text-muted">
                {[c.email, c.phone].filter(Boolean).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      )}
      {record.items && (
        <div className="space-y-2 rounded-xl bg-canvas p-4">
          {record.items.map((item, i) => (
            <div className="flex justify-between gap-3 text-xs" key={i}>
              <span>
                {item.description} × {item.quantity}
              </span>
              <span>{money(item.quantity * item.rate)}</span>
            </div>
          ))}
          <p className="border-t border-line pt-3 text-right text-sm font-semibold">
            Total {money(record.amount)}
          </p>
        </div>
      )}
      {resource === 'media' && record.url && (
        <a
          className="btn btn-secondary"
          target="_blank"
          rel="noreferrer"
          href={`${api.defaults.baseURL}/media/${record._id}/download`}
        >
          <Download size={14} />
          Open asset
        </a>
      )}
      {['brands', 'campaigns', 'content'].includes(resource) && (
        <RelatedRecords resource={resource} id={record._id} />
      )}
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button onClick={onEdit}>
          <Pencil size={14} />
          Edit {config.singular}
        </Button>
        {!['media', 'notifications'].includes(resource) && (
          <Button variant="secondary" onClick={onDuplicate}>
            <Copy size={14} />
            Duplicate
          </Button>
        )}
        {resource === 'invoices' && (
          <>
            <a
              href={`/pay/${record._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary inline-flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              Client Portal
            </a>
            <Button
              variant="secondary"
              onClick={() => {
                const payUrl = `${window.location.origin}/pay/${record._id}`;
                navigator.clipboard.writeText(payUrl);
                toast.success('Client payment link copied!');
              }}
            >
              <Copy size={14} />
              Copy Pay Link
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadInvoice(record._id).catch((e) => toast.error(message(e)))}
            >
              <Download size={14} />
              Download PDF
            </Button>
          </>
        )}
        {resource === 'contracts' && (
          <>
            <a
              href={`/sign/${record.signingToken || record._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary inline-flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              E-Sign Portal
            </a>
            <Button
              variant="secondary"
              onClick={() => {
                const signUrl = `${window.location.origin}/sign/${record.signingToken || record._id}`;
                navigator.clipboard.writeText(signUrl);
                toast.success('Public E-Sign link copied!');
              }}
            >
              <Copy size={14} />
              Copy Sign Link
            </Button>
          </>
        )}
        <button
          className="icon-btn ml-auto text-[#aa6b61]"
          aria-label="Archive record"
          onClick={onDelete}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
export default function ResourcePage({ resource }) {
  const config = resources[resource],
    base = pathFor(resource);
  const navigate = useNavigate(),
    location = useLocation(),
    { id } = useParams();
  const isNew = location.pathname.endsWith('/new'),
    isEdit = location.pathname.endsWith('/edit');
  const [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [platform, setPlatform] = useState(''),
    [assignee, setAssignee] = useState(''),
    [teamMembers, setTeamMembers] = useState([]),
    [sort, setSort] = useState('-createdAt'),
    [page, setPage] = useState(1),
    [limit, setLimit] = useState(10),
    [view, setView] = useState(
      localStorage.getItem(`view-${resource}`) || (resource === 'media' ? 'grid' : 'list'),
    ),
    [selected, setSelected] = useState([]),
    [remove, setRemove] = useState(null),
    [busy, setBusy] = useState(false),
    [upload, setUpload] = useState(false),
    [cloudUpload, setCloudUpload] = useState(false);
  const [file, setFile] = useState(null),
    [mediaConfig, setMediaConfig] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const supportsAssigneeFilter = ['campaigns', 'content', 'tasks'].includes(resource);
  const debounced = useDebounce(search);
  const query = useData(
    () =>
      service.list(resource, {
        search: debounced,
        status,
        platform,
        ...(assignee
          ? resource === 'campaigns'
            ? { assignedMember: assignee }
            : { assignedTo: assignee }
          : {}),
        sort,
        page,
        limit,
      }),
    [resource, debounced, status, platform, assignee, sort, page, limit],
  );
  const recordQuery = useData(
    () => (id && id !== 'new' ? service.get(resource, id) : Promise.resolve(null)),
    [resource, id],
  );
  useEffect(() => {
    setPage(1);
    setSelected([]);
    setAssignee('');
  }, [debounced, status, platform, limit, resource]);
  useEffect(() => {
    if (resource === 'media')
      api
        .get('/media/config')
        .then((r) => setMediaConfig(r.data.data))
        .catch(() => {});
    if (supportsAssigneeFilter) {
      memberApi
        .list({ status: 'active', limit: 100 })
        .then((res) => setTeamMembers((res.items || []).filter((m) => m.user?._id || m.userId)))
        .catch(() => setTeamMembers([]));
    } else {
      setTeamMembers([]);
    }
  }, [resource, supportsAssigneeFilter]);
  const close = useCallback(() => navigate(base), [base]);
  const saved = () => {
    close();
    query.refresh();
  };
  const switchView = (value) => {
    setView(value);
    localStorage.setItem(`view-${resource}`, value);
  };
  const archive = async () => {
    setBusy(true);
    try {
      for (const itemId of remove) await service.remove(resource, itemId);
      toast.success('Archived successfully.');
      setRemove(null);
      setSelected([]);
      close();
      query.refresh();
    } catch (e) {
      toast.error(message(e));
    } finally {
      setBusy(false);
    }
  };
  const duplicate = async () => {
    try {
      await service.duplicate(resource, id);
      toast.success('A copy is ready.');
      query.refresh();
      close();
    } catch (e) {
      toast.error(message(e));
    }
  };
  const uploadFile = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post('/media/upload', form, { timeout: 120000 });
      toast.success('Asset uploaded.');
      setUpload(false);
      setFile(null);
      query.refresh();
    } catch (e) {
      toast.error(message(e));
    } finally {
      setBusy(false);
    }
  };
  const updateStatus = async (item, value) => {
    try {
      await service.update(resource, item._id, { status: value });
      query.refresh();
      toast.success('Status updated.');
    } catch (e) {
      toast.error(message(e));
    }
  };
  const columns =
    resource === 'content'
      ? ['Content', 'Platform', 'Publish date', 'Status']
      : resource === 'tasks'
        ? ['Task', 'Priority', 'Due date', 'Status']
        : resource === 'brands'
          ? ['Brand', 'Industry', 'Contact', 'Website']
          : ['revenue', 'expenses', 'invoices', 'deals'].includes(resource)
            ? [
                config.singular === 'income'
                  ? 'Transaction'
                  : config.singular[0].toUpperCase() + config.singular.slice(1),
                'Amount',
                'Date',
                'Status',
              ]
            : resource === 'campaigns'
              ? ['Campaign', 'Budget', 'Progress', 'Status']
              : resource === 'media'
                ? ['Asset', 'Type', 'Size', 'Uploaded']
                : ['Notification', 'Type', 'Received', 'Read'];
  const rows = query.data?.items || [];
  const statuses = config.fields.find((f) => f.key === 'status')?.options;
  const finances = ['revenue', 'expenses', 'invoices'].includes(resource);
  return (
    <>
      <PageHeader title={config.label} description={config.description}>
        <Button variant="secondary" onClick={() => setShowArchived(true)}>
          Archived records
        </Button>
        <Button
          variant="secondary"
          onClick={() => exportCSV(rows, resource)}
          disabled={!rows.length}
        >
          <Download size={14} />
          Export page
        </Button>
        {resource === 'notifications' ? (
          <Button
            onClick={async () => {
              await api.post('/notifications/read-all');
              query.refresh();
              toast.success('All caught up.');
            }}
          >
            <Check size={14} />
            Mark all read
          </Button>
        ) : resource === 'media' ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setCloudUpload(true)}>
              <UploadCloud size={14} />
              Direct Cloud (S3/R2)
            </Button>
            <Button onClick={() => setUpload(true)}>
              <Upload size={14} />
              Upload asset
            </Button>
          </div>
        ) : (
          <Link className="btn btn-primary" to={`${base}/new`}>
            <Plus size={15} />
            New {config.singular}
          </Link>
        )}
      </PageHeader>
      {finances && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total records"
            value={query.data?.total || 0}
            detail="in the current filter"
          />
          <StatCard
            label="Value on this page"
            value={money(rows.reduce((s, r) => s + (r.amount || 0), 0))}
            detail={`${rows.length} displayed records`}
          />
          <StatCard
            label={resource === 'expenses' ? 'Categories on this page' : 'Paid on this page'}
            value={
              resource === 'expenses'
                ? new Set(rows.map((r) => r.category)).size
                : money(rows.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.amount, 0))
            }
            detail="Use dashboard for period totals"
          />
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-lg border border-line px-3 py-2.5">
            <Search size={15} className="text-muted" />
            <input
              className="w-full min-w-0 bg-transparent text-xs outline-none"
              aria-label={`Search ${config.label}`}
              placeholder={`Search ${config.label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {statuses && (
            <select
              aria-label="Filter by status"
              className="input w-auto text-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          {config.fields.some((f) => f.key === 'platform') && (
            <select
              aria-label="Filter by platform"
              className="input w-auto text-xs"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">All platforms</option>
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          )}
          {supportsAssigneeFilter && teamMembers.length > 0 && (
            <select
              aria-label="Filter by team member"
              className="input w-auto text-xs"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">All team members</option>
              {teamMembers.map((m) => {
                const uid = String(m.user?._id || m.userId);
                return (
                  <option key={uid} value={uid}>
                    {m.user?.name || m.email}
                  </option>
                );
              })}
            </select>
          )}
          <select
            aria-label="Sort records"
            className="input w-auto text-xs"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="title">Title A–Z</option>
            {finances && <option value="-amount">Highest amount</option>}
          </select>
          <div className="flex gap-0.5 rounded-lg border border-line p-0.5">
            <button
              className={`icon-btn h-8 w-8 ${view === 'list' ? 'bg-sage text-accent' : ''}`}
              aria-label="List view"
              onClick={() => switchView('list')}
            >
              <List size={15} />
            </button>
            <button
              className={`icon-btn h-8 w-8 ${view === 'grid' ? 'bg-sage text-accent' : ''}`}
              aria-label={resource === 'tasks' ? 'Board view' : 'Grid view'}
              onClick={() => switchView('grid')}
            >
              <LayoutGrid size={15} />
            </button>
            {resource === 'content' && (
              <Link to="/calendar" className="icon-btn h-8 w-8" aria-label="Calendar view">
                <CalendarDays size={15} />
              </Link>
            )}
          </div>
        </div>
        {selected.length > 0 && (
          <div className="flex items-center justify-between bg-sage px-5 py-3 text-xs">
            <span>{selected.length} selected</span>
            <Button variant="secondary" onClick={() => setRemove(selected)}>
              Archive selected
            </Button>
          </div>
        )}
        {query.error ? (
          <ErrorState error={query.error} retry={query.refresh} />
        ) : query.loading ? (
          <div className="p-6">
            <Loading />
          </div>
        ) : !rows.length ? (
          <Empty
            title={
              search || status
                ? 'No matches this time'
                : `Your ${config.label.toLowerCase()} starts here`
            }
            description={
              search || status
                ? 'Try another search or clear your filters.'
                : 'Bring your next idea into your workspace.'
            }
            action={
              resource !== 'media' && resource !== 'notifications' ? (
                <Link className="btn btn-primary" to={`${base}/new`}>
                  <Plus size={14} />
                  New {config.singular}
                </Link>
              ) : null
            }
          />
        ) : view === 'grid' && resource === 'tasks' ? (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
            {statuses.map((s) => (
              <div key={s} className="min-w-0 rounded-xl bg-canvas p-3">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold">{s}</span>
                  <span className="text-[10px] text-muted">
                    {rows.filter((r) => r.status === s).length}
                  </span>
                </div>
                {rows
                  .filter((r) => r.status === s)
                  .map((item) => (
                    <div key={item._id} className="card mb-3 p-3">
                      <Link
                        className="text-xs font-medium leading-relaxed"
                        to={`${base}/${item._id}`}
                      >
                        {item.title}
                      </Link>
                      <div className="my-3 flex justify-between">
                        <Badge>{item.priority}</Badge>
                        <span className="text-[10px] text-muted">
                          {date(item.dueDate, 'dd MMM')}
                        </span>
                      </div>
                      <select
                        className="input py-1 text-[10px]"
                        aria-label={`Move ${item.title}`}
                        value={item.status}
                        onChange={(e) => updateStatus(item, e.target.value)}
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ) : view === 'grid' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((item) => (
              <Link
                to={`${base}/${item._id}`}
                key={item._id}
                className="card overflow-hidden transition hover:border-[#91a481]"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-canvas text-muted">
                    {resource === 'media' ? (
                      <Image size={30} strokeWidth={1} />
                    ) : (
                      <span className="text-4xl font-light">{item.title[0]}</span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="my-3 text-[11px] text-muted">
                    {item.platform || item.category || item.industry || date(item.createdAt)}
                  </p>
                  <div className="flex items-center justify-between">
                    {item.status && <Badge>{item.status}</Badge>}
                    {item.amount != null && (
                      <span className="text-xs font-semibold">{money(item.amount)}</span>
                    )}
                    <ArrowUpRight size={14} className="ml-auto text-muted" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="w-10 px-5 py-3">
                    <input
                      aria-label="Select all displayed records"
                      type="checkbox"
                      checked={rows.length > 0 && selected.length === rows.length}
                      onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r._id) : [])}
                    />
                  </th>
                  {columns.map((label, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 font-medium ${i === 1 || i === 2 ? 'hidden md:table-cell' : ''}`}
                    >
                      {label}
                    </th>
                  ))}
                  <th className="w-10">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item._id} className="group transition hover:bg-canvas/50">
                    <td className="table-cell pr-0">
                      <input
                        aria-label={`Select ${item.title}`}
                        type="checkbox"
                        checked={selected.includes(item._id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, item._id]
                              : selected.filter((id) => id !== item._id),
                          )
                        }
                      />
                    </td>
                    <td className="table-cell">
                      <Link to={`${base}/${item._id}`} className="flex items-center gap-3">
                        {resource === 'content' && item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="hidden h-10 w-12 rounded-lg object-cover sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="line-clamp-2 min-w-[100px] text-[12px] font-medium">
                            {item.title}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {item.number ||
                              item.type ||
                              item.category ||
                              item.description?.slice(0, 60)}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="table-cell hidden whitespace-nowrap md:table-cell">
                      {resource === 'content' ? (
                        item.platform
                      ) : resource === 'tasks' ? (
                        <Badge>{item.priority}</Badge>
                      ) : resource === 'brands' ? (
                        item.industry
                      ) : resource === 'campaigns' ? (
                        money(item.budget)
                      ) : resource === 'media' || resource === 'notifications' ? (
                        item.category
                      ) : (
                        money(item.amount)
                      )}
                    </td>
                    <td className="table-cell hidden text-muted md:table-cell">
                      {resource === 'brands'
                        ? item.contactPerson
                        : resource === 'campaigns'
                          ? `${item.progress || 0}% complete`
                          : resource === 'media'
                            ? `${Math.round(item.size / 1024)} KB`
                            : date(
                                item.publishDate || item.dueDate || item.date || item.createdAt,
                                'dd MMM yyyy',
                              )}
                    </td>
                    <td className="table-cell">
                      {item.status ? (
                        <Badge>{item.status}</Badge>
                      ) : resource === 'notifications' ? (
                        <button
                          className="text-xs text-accent"
                          onClick={async () => {
                            await service.update(resource, item._id, { read: !item.read });
                            query.refresh();
                          }}
                        >
                          {item.read ? 'Read' : 'Mark read'}
                        </button>
                      ) : resource === 'brands' ? (
                        <span className="text-[10px] text-muted">
                          {item.website ? new URL(item.website).hostname : '—'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted">
                          {date(item.createdAt, 'dd MMM')}
                        </span>
                      )}
                    </td>
                    <td className="table-cell px-2">
                      <div className="flex items-center justify-end gap-1">
                        {resource === 'invoices' && (
                          <button
                            type="button"
                            className="icon-btn h-8 w-8 text-muted hover:text-accent"
                            title="Copy Client Pay Link"
                            aria-label="Copy Client Pay Link"
                            onClick={(e) => {
                              e.stopPropagation();
                              const payUrl = `${window.location.origin}/pay/${item._id}`;
                              navigator.clipboard.writeText(payUrl);
                              toast.success('Pay link copied!');
                            }}
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        {resource === 'contracts' && (
                          <button
                            type="button"
                            className="icon-btn h-8 w-8 text-muted hover:text-accent"
                            title="Copy Public E-Sign Link"
                            aria-label="Copy Public E-Sign Link"
                            onClick={(e) => {
                              e.stopPropagation();
                              const signUrl = `${window.location.origin}/sign/${item.signingToken || item._id}`;
                              navigator.clipboard.writeText(signUrl);
                              toast.success('E-Sign link copied!');
                            }}
                          >
                            <Copy size={14} />
                          </button>
                        )}
                        <Link
                          to={`${base}/${item._id}`}
                          className="icon-btn h-8 w-8"
                          aria-label={`View ${item.title}`}
                        >
                          <ArrowUpRight size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-[11px] text-muted">
          <span>
            {query.data?.total || 0} records · Page {page} of {Math.max(1, query.data?.pages || 1)}
            {view === 'grid' && resource === 'tasks' ? ' · Board shows this page' : ''}
          </span>
          <div className="flex items-center gap-3">
            <select
              aria-label="Rows per page"
              className="rounded border border-line bg-transparent p-1"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
            <button
              aria-label="Previous page"
              className="icon-btn h-7 w-7 disabled:opacity-30"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              aria-label="Next page"
              className="icon-btn h-7 w-7 disabled:opacity-30"
              disabled={page >= (query.data?.pages || 1)}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
      {(isNew || id) && (
        <Modal
          wide
          title={
            isNew
              ? `New ${config.singular}`
              : isEdit
                ? `Edit ${config.singular}`
                : config.singular[0].toUpperCase() + config.singular.slice(1)
          }
          onClose={close}
        >
          {isNew ? (
            <ResourceForm resource={resource} onSaved={saved} onCancel={close} />
          ) : recordQuery.loading ? (
            <Loading />
          ) : recordQuery.error ? (
            <ErrorState error={recordQuery.error} retry={recordQuery.refresh} />
          ) : (
            recordQuery.data &&
            (isEdit ? (
              <ResourceForm
                resource={resource}
                record={recordQuery.data}
                onSaved={saved}
                onCancel={close}
              />
            ) : (
              <Detail
                resource={resource}
                record={recordQuery.data}
                onEdit={() => navigate(`${base}/${id}/edit`)}
                onDelete={() => {
                  setRemove([id]);
                  close();
                }}
                onDuplicate={duplicate}
              />
            ))
          )}
        </Modal>
      )}
      {showArchived && (
        <ArchivedRecords
          resource={resource}
          onClose={() => setShowArchived(false)}
          onRestore={query.refresh}
        />
      )}
      {remove && (
        <Modal title="Archive this record?" onClose={() => setRemove(null)}>
          <p className="mb-6 text-sm leading-relaxed text-muted">
            {remove.length > 1 ? `These ${remove.length} records` : 'This record'} will be removed
            from your workspace views. Related historical records are preserved.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Keep records
            </Button>
            <Button onClick={archive} loading={busy}>
              Archive
            </Button>
          </div>
        </Modal>
      )}
      {upload && (
        <Modal title="Add to your media library" onClose={() => setUpload(false)}>
          {mediaConfig?.configured ? (
            <>
              <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-line bg-canvas p-8 text-center">
                <Upload size={26} className="mb-4 text-muted" />
                <span className="text-sm">{file ? file.name : 'Choose a file to upload'}</span>
                <span className="mt-2 text-xs text-muted">
                  JPG, PNG, WebP, AVIF, MP4, WebM, or PDF · up to 25 MB
                </span>
                <input
                  className="mt-4 w-full text-xs"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              <UploadPreview file={file} />
              <Button className="mt-5 w-full" disabled={!file} loading={busy} onClick={uploadFile}>
                Upload asset
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium">Connect your media storage</h3>
              <p className="text-sm leading-relaxed text-muted">
                Uploads require Cloudinary. Add your Cloudinary credentials to the server
                environment and restart the API to enable secure asset storage.
              </p>
            </div>
          )}
        </Modal>
      )}
      <CloudStorageUploader
        isOpen={cloudUpload}
        onClose={() => setCloudUpload(false)}
        onUploadComplete={() => query.refresh()}
      />
    </>
  );
}