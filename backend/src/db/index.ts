import initSqlJs, { Database } from "sql.js";
import path from "node:path";
import fs from "node:fs";
import { INIT_SQL } from "./schema.js";

const DB_PATH = path.join(process.cwd(), "data.sqlite");

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(INIT_SQL);

  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function closeDb(): void {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}
