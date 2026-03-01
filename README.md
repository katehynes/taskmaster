# Taskmaster

A personal, calendar-centric to-do app with cloud-backed storage.

## Setup

Install dependencies in both projects (first time only):

```bash
cd backend && npm install && cd ../frontend && npm install
```

### Run both backend and frontend

From the project root:

```bash
npm run dev
```

This starts the API at `http://localhost:4000` and the app at `http://localhost:5173` (or the port Vite reports). Open the frontend URL in your browser.

**Both must be running** for tasks to persist. If the backend is down, you’ll see a yellow banner and tasks won’t be saved when you add, edit, or delete.

### Run separately

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm run dev
```

### Troubleshooting

**"Address already in use" (port 4000)** — A previous backend process may still be running. Kill it:
```bash
lsof -ti :4000 | xargs kill
```

## Project structure

- `frontend/` — React + TypeScript (Vite)
- `backend/` — Node + Express + TypeScript, SQLite (sql.js)
