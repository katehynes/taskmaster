# Taskmaster

A calendar-centric to-do app with **accounts**, **JWT auth**, and data stored in **LibSQL**—either a [Turso](https://turso.tech/) database in the cloud or a local SQLite file when no remote URL is configured. The React frontend can be run standalone in development (Vite) or **served by the same Express process** as the API after you build it.

## Live app

**[https://taskmaster-74ky.onrender.com/](https://taskmaster-74ky.onrender.com/)** — hosted on [Render](https://render.com/)’s free tier. The URL **may change** if the service is recreated or moved; treat it as a convenience link, not a permanent API contract.

## Features

- **Sign in / Register** — Email and password; session uses a bearer token stored in the browser. Tasks and settings are **per user**.
- **Day** — Tasks for the selected date: add, edit, complete, delete, optional notes.
- **Calendar** — Pick a month and jump to any day (switches back to Day view with that date).
- **Outstanding** — Tasks with no scheduled date, ordered by creation time.
- **Retention** — In Settings (gear icon), choose how many calendar days **after** a task’s scheduled date it is kept; after that window, **dated** tasks are **removed** from the database (default: 30). The scheduled day counts as day 0. Tasks with **no** scheduled date (outstanding) are not auto-deleted.
- **Backend health** — If the API is unreachable, a warning banner appears and changes are not saved.

## Stack

| Part       | Technology |
| ---------- | ---------- |
| Frontend   | React 19, TypeScript, Vite 5 |
| Backend    | Node.js, Express, TypeScript (`tsx` in dev) |
| Database   | [@libsql/client](https://github.com/tursodatabase/libsql-client-ts) (Turso or local `data.sqlite`) |
| Auth       | bcrypt (passwords), [jose](https://github.com/panva/jose) (JWT access tokens) |
| Dev (both) | Root `concurrently` script runs backend + Vite |

## Configuration (`backend/.env`)

Create `backend/.env` (it is gitignored). Do **not** commit secrets or tokens.

| Variable | Purpose |
| -------- | ------- |
| `TURSO_DATABASE_URL` | Optional. LibSQL URL (e.g. `libsql://…`). If omitted, the app uses a **local** SQLite file `data.sqlite` in the backend working directory. |
| `TURSO_AUTH_TOKEN` | Required for Turso **hosted** databases; omit for local file URLs. |
| `JWT_SECRET` | Secret for signing access tokens (at least 32 characters). **Required in production**; in development an insecure default is used if unset (with a warning). |
| `PORT` | API port (default `4000`). |

## Setup

**1. Install dependencies** (first time only)

```bash
npm install
cd backend && npm install && cd ../frontend && npm install && cd ..
```

**2. Configure the backend** — Add `backend/.env` as above. For Turso, create a database in the Turso dashboard and paste the URL and a database token.

**3. Run backend and frontend together** (typical local dev)

```bash
npm run dev
```

This starts:

- **API** — `http://localhost:4000` (override with `PORT`; if you change it, update the `proxy` target in `frontend/vite.config.ts` so Vite still proxies `/api`).
- **Frontend** — Vite (usually `http://localhost:5173`). **`/api` is proxied** to the backend, so the browser talks to one origin for the SPA and the dev server forwards API calls.

Open the Vite URL. **Both processes must be running** in this mode.

### Run separately

**Backend only**

```bash
cd backend
npm run dev
```

**Frontend only**

```bash
cd frontend
npm run dev
```

### Production-style: API + static UI on one port

Build the frontend, then build and start the backend. If `frontend/dist` exists, Express serves it and falls back to `index.html` for client routes (see `backend/src/index.ts`).

```bash
cd frontend && npm run build && cd ../backend && npm run build && npm start
```

Then open `http://localhost:4000` (or your `PORT`). No Vite proxy is needed—the app and `/api` share the same origin.

## API (summary)

Public (no auth):

| Method / path | Purpose |
| ------------- | ------- |
| `GET /api/health` | `{ ok: true }` liveness |

Auth (no bearer required for login/register):

| Method / path | Purpose |
| ------------- | ------- |
| `POST /api/auth/register` | Body: `{ email, password }` → `{ user, token }` |
| `POST /api/auth/login` | Body: `{ email, password }` → `{ user, token }` |
| `GET /api/auth/me` | **Bearer** required → `{ user: { id, email } }` |

Tasks and settings require `Authorization: Bearer <token>`:

| Method / path | Purpose |
| ------------- | ------- |
| `GET /api/tasks` | Query: `forDate`, or `fromDate` + `toDate`, or `outstanding=true` |
| `POST /api/tasks` | Create: `title`, optional `forDate`, `notes` |
| `PATCH /api/tasks/:id` | Update fields including `completed` |
| `DELETE /api/tasks/:id` | Delete |
| `GET /api/settings` | `{ expirationDays }` |
| `PATCH /api/settings` | `{ expirationDays }` (non-negative integer) |

## Project layout

- `frontend/` — React app; in dev, `/api` → `http://localhost:4000` via `vite.config.ts`.
- `backend/` — Express API, loads `.env` from `backend/.env`, LibSQL client, optional static files from `../frontend/dist`.

## Troubleshooting

**Port 4000 already in use**

```bash
lsof -ti :4000 | xargs kill
```

**Cannot reach backend (dev)** — Ensure the backend is running and use the **Vite** dev URL so `/api` is proxied.

**401 after login** — Token expired or `JWT_SECRET` changed; sign in again. In production, always set a stable `JWT_SECRET`.
