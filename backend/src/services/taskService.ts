import { getDb } from "../db/index.js";
import { rowToTask } from "../db/mappers.js";
import type { TaskRow } from "../db/mappers.js";
import type { Task, TaskCreateInput, TaskUpdateInput } from "../types.js";
import { isTaskWithinRetention, todayISO } from "./expiration.js";
import { randomUUID } from "node:crypto";

export interface GetTasksOptions {
  forDate?: string;
  fromDate?: string;
  toDate?: string;
  /** When true, return only tasks with no scheduled date (outstanding). */
  outstanding?: boolean;
}

async function getExpirationDaysForUser(userId: string): Promise<number> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT expiration_days FROM settings WHERE id = ?",
    args: [userId],
  });
  if (rs.rows.length > 0) {
    const row = rs.rows[0] as { expiration_days?: number };
    return Number(row.expiration_days ?? 30);
  }
  return 30;
}

/** Removes dated tasks past the user's retention window (scheduled date + expiration days). */
export async function purgeExpiredTasksForUser(userId: string): Promise<void> {
  const db = await getDb();
  const expirationDays = await getExpirationDaysForUser(userId);
  const today = todayISO();
  const sel = await db.execute({
    sql: "SELECT id, for_date FROM tasks WHERE owner_id = ? AND for_date IS NOT NULL",
    args: [userId],
  });
  const toDelete: string[] = [];
  for (const row of sel.rows) {
    const r = row as { id?: string; for_date?: string | null };
    const fd = r.for_date;
    const id = r.id;
    if (
      fd != null &&
      id != null &&
      !isTaskWithinRetention(fd, expirationDays, today)
    ) {
      toDelete.push(id);
    }
  }
  if (toDelete.length === 0) return;
  const placeholders = toDelete.map(() => "?").join(",");
  await db.execute({
    sql: `DELETE FROM tasks WHERE owner_id = ? AND id IN (${placeholders})`,
    args: [userId, ...toDelete],
  });
}

export async function getTasks(
  userId: string,
  options: GetTasksOptions = {}
): Promise<Task[]> {
  await purgeExpiredTasksForUser(userId);
  const db = await getDb();

  if (options.outstanding) {
    const stmt = await db.execute({
      sql: `SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id
       FROM tasks
       WHERE for_date IS NULL AND owner_id = ?
       ORDER BY created_at`,
      args: [userId],
    });
    return stmt.rows.map((row) =>
      rowToTask(row as unknown as TaskRow)
    );
  }

  let fromDate = options.fromDate;
  let toDate = options.toDate;
  if (options.forDate) {
    fromDate = options.forDate;
    toDate = options.forDate;
  }
  if (!fromDate || !toDate) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    fromDate = start.toISOString().slice(0, 10);
    toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
  }

  const stmt = await db.execute({
    sql: `SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id
     FROM tasks
     WHERE owner_id = ? AND for_date IS NOT NULL AND for_date >= ? AND for_date <= ?
     ORDER BY for_date, created_at`,
    args: [userId, fromDate, toDate],
  });

  return stmt.rows.map((row) => rowToTask(row as unknown as TaskRow));
}

export async function createTask(
  userId: string,
  input: TaskCreateInput
): Promise<Task> {
  await purgeExpiredTasksForUser(userId);
  const db = await getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const notes = input.notes ?? null;

  const forDate = input.forDate ?? null;
  await db.execute({
    sql: `INSERT INTO tasks (id, title, for_date, notes, completed, created_at, updated_at, owner_id)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
    args: [id, input.title, forDate, notes, now, now, userId],
  });

  const sel = await db.execute({
    sql: "SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ? AND owner_id = ?",
    args: [id, userId],
  });
  if (sel.rows.length > 0) {
    return rowToTask(sel.rows[0] as unknown as TaskRow);
  }
  throw new Error("Failed to read created task");
}

export async function updateTask(
  userId: string,
  id: string,
  input: TaskUpdateInput
): Promise<Task | null> {
  await purgeExpiredTasksForUser(userId);
  const db = await getDb();
  const now = new Date().toISOString();

  const existingStmt = await db.execute({
    sql: "SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ? AND owner_id = ?",
    args: [id, userId],
  });
  if (existingStmt.rows.length === 0) {
    return null;
  }
  const current = existingStmt.rows[0] as Record<string, unknown>;

  const title = input.title ?? (current.title as string);
  const for_date =
    input.forDate !== undefined
      ? input.forDate
      : (current.for_date as string | null);
  const notes =
    input.notes !== undefined ? input.notes : (current.notes as string | null);
  const completed =
    input.completed !== undefined
      ? input.completed
        ? 1
        : 0
      : (current.completed as number);

  await db.execute({
    sql: `UPDATE tasks SET title = ?, for_date = ?, notes = ?, completed = ?, updated_at = ? WHERE id = ? AND owner_id = ?`,
    args: [title, for_date, notes, completed, now, id, userId],
  });

  const updatedStmt = await db.execute({
    sql: "SELECT id, title, for_date, notes, completed, created_at, updated_at, owner_id FROM tasks WHERE id = ? AND owner_id = ?",
    args: [id, userId],
  });
  if (updatedStmt.rows.length > 0) {
    return rowToTask(updatedStmt.rows[0] as unknown as TaskRow);
  }
  return null;
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  await purgeExpiredTasksForUser(userId);
  const db = await getDb();
  const rs = await db.execute({
    sql: "DELETE FROM tasks WHERE id = ? AND owner_id = ?",
    args: [id, userId],
  });
  return rs.rowsAffected > 0;
}
