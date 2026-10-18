import { useState } from 'react';
import toast from 'react-hot-toast';
import { service, message } from '../services/api';
import { useData, useDebounce } from '../hooks/useData';
import { Button, Empty, ErrorState, Loading, Modal } from './ui';
import { date } from '../utils/format';
export default function ArchivedRecords({ resource, onClose, onRestore }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const debounced = useDebounce(search);
  const query = useData(
    () =>
      service.list(resource, {
        archived: true,
        search: debounced,
        page,
        limit: 10,
      }),
    [resource, debounced, page],
  );
  async function restore(record) {
    setBusy(record._id);
    try {
      await service.restore(resource, record._id);
      toast.success('Record restored');
      if (query.data.items.length === 1 && page > 1) setPage(page - 1);
      else query.refresh();
      onRestore();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(null);
    }
  }
  return (
    <Modal title="Archived records" onClose={onClose}>
      <p className="mb-4 text-sm text-muted">
        Restore a record with its original details and history.
      </p>
      <input
        className="input mb-4"
        aria-label="Search archived records"
        placeholder="Search archived records…"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} retry={query.refresh} />
      ) : !query.data?.items.length ? (
        <Empty title="No archived records" description="Records you archive will appear here." />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {query.data.items.map((record) => (
              <li key={record._id} className="flex items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{record.title}</p>
                  <p className="mt-1 text-xs text-muted">Archived {date(record.deletedAt)}</p>
                </div>
                <Button
                  variant="secondary"
                  disabled={!!busy}
                  loading={busy === record._id}
                  onClick={() => restore(record)}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              {query.data.total} records · Page {page} of {query.data.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page === 1 || !!busy}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= query.data.pages || !!busy}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}