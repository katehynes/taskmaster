import { getDb, saveDb } from "../db/index.js";
import { rowToSettings } from "../db/mappers.js";
export async function getSettings() {
    const db = await getDb();
    const rows = db.exec("SELECT id, owner_id, expiration_days FROM settings WHERE id = 'default'");
    if (rows.length > 0 && rows[0].values.length > 0) {
        const cols = rows[0].columns;
        const r = {};
        cols.forEach((c, i) => (r[c] = rows[0].values[0][i]));
        return rowToSettings(r);
    }
    return { id: "default", ownerId: null, expirationDays: 2 };
}
export async function updateSettings(input) {
    const db = await getDb();
    db.run("UPDATE settings SET expiration_days = ? WHERE id = 'default'", [input.expirationDays]);
    saveDb();
    const updated = await getSettings();
    return updated;
}
