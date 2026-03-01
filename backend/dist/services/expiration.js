/**
 * A task is visible if today <= forDate + expirationDays.
 * Equivalently: forDate >= today - expirationDays.
 */
export function isTaskVisible(forDate, expirationDays, today) {
    const expiry = addDays(forDate, expirationDays);
    return today <= expiry;
}
export function addDays(isoDate, days) {
    const d = new Date(isoDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}
export function todayISO() {
    return new Date().toISOString().slice(0, 10);
}
