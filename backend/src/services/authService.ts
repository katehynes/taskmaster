import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";
import { getDb } from "../db/index.js";
import { signAccessToken } from "../auth/jwt.js";

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LEN = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function assignOrphanTasksToUser(db: Client, userId: string) {
  const rs = await db.execute("SELECT COUNT(*) AS c FROM users");
  const n =
    rs.rows.length > 0 ? Number(rs.rows[0].c ?? rs.rows[0][0] ?? 0) : 0;
  if (n === 1) {
    await db.execute({
      sql: "UPDATE tasks SET owner_id = ? WHERE owner_id IS NULL",
      args: [userId],
    });
  }
}

async function ensureUserSettingsRow(db: Client, userId: string): Promise<void> {
  const check = await db.execute({
    sql: "SELECT id FROM settings WHERE id = ?",
    args: [userId],
  });
  if (check.rows.length > 0) return;
  await db.execute({
    sql: `INSERT INTO settings (id, owner_id, expiration_days) VALUES (?, ?, 30)`,
    args: [userId, userId],
  });
}

export interface AuthUser {
  id: string;
  email: string;
}

export async function registerUser(
  emailRaw: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const email = normalizeEmail(emailRaw);
  if (!validateEmail(email)) {
    throw new Error("Invalid email address");
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LEN) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LEN} characters`);
  }

  const db = await getDb();
  const dup = await db.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email],
  });
  if (dup.rows.length > 0) {
    throw new Error("An account with this email already exists");
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`,
    args: [id, email, password_hash, now],
  });
  await assignOrphanTasksToUser(db, id);
  await ensureUserSettingsRow(db, id);

  const token = await signAccessToken(id, email);
  return { user: { id, email }, token };
}

export async function loginUser(
  emailRaw: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const email = normalizeEmail(emailRaw);
  if (!validateEmail(email)) {
    throw new Error("Invalid email address");
  }
  if (typeof password !== "string" || password.length < 1) {
    throw new Error("Password is required");
  }

  const db = await getDb();
  const stmt = await db.execute({
    sql: "SELECT id, email, password_hash FROM users WHERE email = ?",
    args: [email],
  });
  if (stmt.rows.length === 0) {
    throw new Error("Invalid email or password");
  }
  const row = stmt.rows[0] as {
    id?: string;
    email?: string;
    password_hash?: string;
  };

  const hash = String(row.password_hash ?? "");
  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    throw new Error("Invalid email or password");
  }

  const id = String(row.id);
  const userEmail = String(row.email);
  await ensureUserSettingsRow(db, id);

  const token = await signAccessToken(id, userEmail);
  return { user: { id, email: userEmail }, token };
}
