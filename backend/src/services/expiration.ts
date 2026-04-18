/**
 * Dated tasks are kept through the calendar day `forDate + expirationDays` (inclusive).
 * After that day, they are purged from the database (see taskService purge).
 */
export function isTaskWithinRetention(
  forDate: string,
  expirationDays: number,
  today: string
): boolean {
  const lastKeptDay = addDays(forDate, expirationDays);
  return today <= lastKeptDay;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
