import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, STATUSES, listEvents } from '../api.js';
import {
  CategoryBadge,
  EmptyState,
  ErrorBanner,
  Spinner,
  StatusBadge,
  formatDate,
} from '../components/ui.jsx';

const LIMIT = 12;

export default function EventsListPage() {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listEvents({ category, status, page, limit: LIMIT })
      .then((res) => !cancelled && setResult(res))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, status, page]);

  const events = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function onFilterChange(setter) {
    return (e) => {
      setPage(1); // reset to first page whenever a filter changes
      setter(e.target.value);
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading…' : `${total} event${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select label="Category" value={category} onChange={onFilterChange(setCategory)} options={CATEGORIES} />
          <Select label="Status" value={status} onChange={onFilterChange(setStatus)} options={STATUSES} />
        </div>
      </div>

      <ErrorBanner error={error} onRetry={() => setPage((p) => p)} />

      {loading ? (
        <Spinner />
      ) : events.length === 0 ? (
        <EmptyState title="No events found" hint="Try clearing filters or create a new event." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <PageButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </PageButton>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <PageButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </PageButton>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-video w-full overflow-hidden bg-slate-100">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl text-slate-300">🗓️</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <CategoryBadge category={event.category} />
          <StatusBadge status={event.status} />
        </div>
        <h3 className="line-clamp-2 font-semibold group-hover:text-indigo-700">{event.title}</h3>
        <p className="mt-auto text-sm text-slate-500">
          {formatDate(event.startDate)}
          {event.venue ? ` · ${event.venue}` : ''}
        </p>
      </div>
    </Link>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col text-xs font-medium text-slate-500">
      {label}
      <select
        value={value}
        onChange={onChange}
        className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
