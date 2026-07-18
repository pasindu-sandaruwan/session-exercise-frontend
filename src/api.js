// Runtime config (window.__ENV__) is written by the container entrypoint at
// startup, so one built image can target any backend. Falls back to the
// build-time env var for local `npm run dev`, then to localhost.
const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__ : undefined;
const BASE_URL =
  runtimeEnv?.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000';

export const CATEGORIES = ['concert', 'exhibition', 'workshop', 'seminar', 'sports', 'other'];
export const STATUSES = ['draft', 'published', 'cancelled'];

/**
 * Thrown for any non-2xx response. Carries the parsed body so callers can
 * surface `message` and the field-level `errors` array from the API.
 */
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.errors = body?.errors;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

/** GET /api/events with optional filters + pagination. Returns { data, total, page, limit }. */
export function listEvents({ category, status, page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return request(`/api/events?${params.toString()}`);
}

export function getEvent(id) {
  return request(`/api/events/${id}`);
}

export function createEvent(payload) {
  return request('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateEvent(id, payload) {
  return request(`/api/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteEvent(id) {
  return request(`/api/events/${id}`, { method: 'DELETE' });
}

export function uploadEventImage(id, file) {
  const form = new FormData();
  form.append('image', file); // field name MUST be "image"
  // Do NOT set Content-Type — the browser sets the multipart boundary.
  return request(`/api/events/${id}/image`, { method: 'POST', body: form });
}

export function deleteEventImage(id) {
  return request(`/api/events/${id}/image`, { method: 'DELETE' });
}
