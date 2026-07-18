# University Events — Frontend

A small React + Tailwind app for managing university events against the
[University Events API](#). No auth required.

## Features

- **Browse** events in a card grid with **category / status filters** and pagination
- **View** a single event's full details and poster
- **Create / edit / delete** events
- **Upload / replace / remove** an event's poster image (S3-backed)

## Stack

React 18 · React Router · Vite · Tailwind CSS v4

## Getting started

```bash
npm install
cp .env.example .env   # then set VITE_API_BASE_URL if not localhost:3000
npm run dev            # http://localhost:5173
```

The API base URL is read from `VITE_API_BASE_URL` (defaults to
`http://localhost:3000`). All calls go to `/api/events`.

```bash
npm run build     # production build -> dist/
npm run preview   # preview the build
```

## Structure

| Path | Purpose |
|------|---------|
| `src/api.js` | Single API client (fetch wrapper, `ApiError`, enums) |
| `src/App.jsx` | Router + layout shell |
| `src/pages/EventsListPage.jsx` | List, filters, pagination |
| `src/pages/EventDetailPage.jsx` | Details, delete, image upload/remove |
| `src/pages/EventFormPage.jsx` | Create & edit form |
| `src/components/ui.jsx` | Shared badges, spinner, error banner, helpers |

## Notes

- Image upload returns **503** until the backend has S3 configured; events
  simply show a placeholder while `imageUrl` is `null`.
- Validation errors (`{ message, errors[] }`) are surfaced field-by-field in the
  form's error banner.
