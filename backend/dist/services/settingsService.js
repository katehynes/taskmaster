import { getDb } from "../db/index.js";
import { rowToSettings } from "../db/mappers.js";
import { purgeExpiredTasksForUser } from "./taskService.js";
export async function getSettings(userId) {
    const db = await getDb();
    const stmt = await db.execute({
        sql: "SELECT id, owner_id, expiration_days FROM settings WHERE id = ?",
        args: [userId],
    });
    if (stmt.rows.length > 0) {
        const row = stmt.rows[0];
        return rowToSettings(row);
    }
    await db.execute({
        sql: `INSERT INTO settings (id, owner_id, expiration_days) VALUES (?, ?, 30)`,
        args: [userId, userId],
    });
    return {
        id: userId,
        ownerId: userId,
        expirationDays: 30,
    };
}
export async function updateSettings(userId, input) {
    const db = await getDb();
    await getSettings(userId);
    await db.execute({
        sql: "UPDATE settings SET expiration_days = ? WHERE id = ?",
        args: [input.expirationDays, userId],
    });
    await purgeExpiredTasksForUser(userId);
    const stmt = await db.execute({
        sql: "SELECT id, owner_id, expiration_days FROM settings WHERE id = ?",
        args: [userId],
    });
    if (stmt.rows.length > 0) {
        const row = stmt.rows[0];
        return rowToSettings(row);
    }
    return { id: userId, ownerId: userId, expirationDays: input.expirationDays };
}
