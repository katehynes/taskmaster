/**
 * Dated tasks are kept through the calendar day `forDate + expirationDays` (inclusive).
 * After that day, they are purged from the database (see taskService purge).
 */
export function isTaskWithinRetention(forDate, expirationDays, today) {
    const lastKeptDay = addDays(forDate, expirationDays);
    return today <= lastKeptDay;
}
export function addDays(isoDate, days) {
    const d = new Date(isoDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}
export function todayISO() {
    return new Date().toISOString().slice(0, 10);
}
