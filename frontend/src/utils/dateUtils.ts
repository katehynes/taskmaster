export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getCalendarDays(month: Date): (string | null)[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const startDay = start.getDay();
  const daysInMonth = end.getDate();
  const out: (string | null)[] = [];
  for (let i = 0; i < startDay; i++) out.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d);
    out.push(toISODate(date));
  }
  return out;
}
