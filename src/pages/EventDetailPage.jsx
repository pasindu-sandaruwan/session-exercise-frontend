import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteEvent,
  deleteEventImage,
  getEvent,
  uploadEventImage,
} from '../api.js';
import {
  CategoryBadge,
  ErrorBanner,
  Spinner,
  StatusBadge,
  formatDate,
} from '../components/ui.jsx';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEvent(id)
      .then((ev) => !cancelled && setEvent(ev))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setBusy(true);
    try {
      await deleteEvent(id);
      navigate('/');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setEvent(await uploadEventImage(id, file));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleRemoveImage() {
    setBusy(true);
    setError(null);
    try {
      setEvent(await deleteEventImage(id));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (error && !event) return <ErrorBanner error={error} onRetry={() => navigate(0)} />;
  if (!event) return null;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← Back to events
      </Link>

      <ErrorBanner error={error} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="aspect-[21/9] w-full overflow-hidden bg-slate-100">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-5xl text-slate-300">🗓️</div>
          )}
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CategoryBadge category={event.category} />
                <StatusBadge status={event.status} />
              </div>
              <h1 className="text-2xl font-semibold">{event.title}</h1>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/events/${event.id}/edit`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>

          {event.description && <p className="whitespace-pre-wrap text-slate-700">{event.description}</p>}

          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Detail label="Starts">{formatDate(event.startDate)}</Detail>
            <Detail label="Ends">{formatDate(event.endDate)}</Detail>
            <Detail label="Venue">{event.venue || '—'}</Detail>
            <Detail label="Organizer">{event.organizer || '—'}</Detail>
            <Detail label="Capacity">{event.capacity ?? '—'}</Detail>
          </dl>

          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-700">Poster image</h2>
            <p className="text-xs text-slate-500">One image per event · max 5 MB · uploading replaces the current one.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                {event.imageUrl ? 'Replace image' : 'Upload image'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={busy}
                  className="hidden"
                />
              </label>
              {event.imageUrl && (
                <button
                  onClick={handleRemoveImage}
                  disabled={busy}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Remove image
                </button>
              )}
              {busy && <span className="text-sm text-slate-500">Working…</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{children}</dd>
    </div>
  );
}
