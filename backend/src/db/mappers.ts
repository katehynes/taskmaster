import type { Task, Settings } from "../types.js";

export interface TaskRow {
  id: string;
  title: string;
  for_date: string;
  notes: string | null;
  completed: number;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
}

export interface SettingsRow {
  id: string;
  owner_id: string | null;
  expiration_days: number;
}

export function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    forDate: r.for_date,
    notes: r.notes,
    completed: Boolean(r.completed),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    ownerId: r.owner_id,
  };
}

export function rowToSettings(r: SettingsRow): Settings {
  return {
    id: r.id,
    ownerId: r.owner_id,
    expirationDays: r.expiration_days,
  };
}
