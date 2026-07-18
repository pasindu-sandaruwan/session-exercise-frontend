import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, STATUSES, createEvent, getEvent, updateEvent } from '../api.js';
import { ErrorBanner, Spinner } from '../components/ui.jsx';

const EMPTY = {
  title: '',
  description: '',
  category: 'other',
  venue: '',
  organizer: '',
  startDate: '',
  endDate: '',
  capacity: '',
  status: 'draft',
};

/** ISO string -> value for <input type="datetime-local"> (local time, no seconds). */
function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

/** datetime-local value -> UTC ISO string the API expects. */
function localInputToIso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    getEvent(id)
      .then((ev) => {
        if (cancelled) return;
        setForm({
          title: ev.title ?? '',
          description: ev.description ?? '',
          category: ev.category ?? 'other',
          venue: ev.venue ?? '',
          organizer: ev.organizer ?? '',
          startDate: isoToLocalInput(ev.startDate),
          endDate: isoToLocalInput(ev.endDate),
          capacity: ev.capacity ?? '',
          status: ev.status ?? 'draft',
        });
      })
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Build a clean payload: trim strings, drop empties, convert types.
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      venue: form.venue.trim() || null,
      organizer: form.organizer.trim() || null,
      startDate: localInputToIso(form.startDate),
      endDate: localInputToIso(form.endDate),
      capacity: form.capacity === '' ? null : Number(form.capacity),
      status: form.status,
    };

    try {
      const saved = isEdit ? await updateEvent(id, payload) : await createEvent(payload);
      navigate(`/events/${saved.id}`);
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={isEdit ? `/events/${id}` : '/'}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Cancel
      </Link>

      <h1 className="text-2xl font-semibold">{isEdit ? 'Edit event' : 'New event'}</h1>

      <ErrorBanner error={error} />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Title" required>
          <input
            type="text"
            required
            maxLength={255}
            value={form.title}
            onChange={set('title')}
            className={inputCls}
            placeholder="Spring Concert"
          />
        </Field>

        <Field label="Description">
          <textarea rows={3} value={form.description} onChange={set('description')} className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Category">
            <select value={form.category} onChange={set('category')} className={`${inputCls} capitalize`}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set('status')} className={`${inputCls} capitalize`}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Start date" required>
            <input type="datetime-local" required value={form.startDate} onChange={set('startDate')} className={inputCls} />
          </Field>
          <Field label="End date">
            <input type="datetime-local" value={form.endDate} onChange={set('endDate')} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Venue">
            <input type="text" maxLength={255} value={form.venue} onChange={set('venue')} className={inputCls} />
          </Field>
          <Field label="Organizer">
            <input type="text" maxLength={255} value={form.organizer} onChange={set('organizer')} className={inputCls} />
          </Field>
        </div>

        <Field label="Capacity">
          <input type="number" min={0} value={form.capacity} onChange={set('capacity')} className={inputCls} placeholder="e.g. 500" />
        </Field>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            to={isEdit ? `/events/${id}` : '/'}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
