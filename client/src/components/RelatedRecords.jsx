import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useData } from '../hooks/useData';
import { Badge } from './ui';
import { pathFor, money } from '../utils/format';
export default function RelatedRecords({ resource, id }) {
  const { data, loading } = useData(
    async () => (await api.get(`/${resource}/${id}/related`)).data.data,
    [resource, id],
  );
  if (loading) return <p className="text-xs text-muted">Loading related records...</p>;
  if (!data?.length) return null;
  return (
    <div className="space-y-4 border-t border-line pt-5">
      <h3 className="text-sm font-semibold">
        Connected to this {resource === 'brands' ? 'brand' : 'campaign'}
      </h3>
      {data.map((group) => (
        <div key={group.resource}>
          <p className="eyebrow mb-2">
            {group.label} · {group.total} records
          </p>
          {group.items.map((item) => (
            <Link
              key={item._id}
              to={`${pathFor(group.resource)}/${item._id}`}
              className="flex items-center justify-between gap-3 border-b border-line py-3 text-xs last:border-0"
            >
              <span>{item.title}</span>
              <span className="shrink-0">
                {item.amount != null ? (
                  money(item.amount)
                ) : item.status ? (
                  <Badge>{item.status}</Badge>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}