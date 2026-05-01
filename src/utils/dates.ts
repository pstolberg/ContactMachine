import {
  differenceInDays,
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
  addYears,
  isBefore,
  setYear,
} from 'date-fns';

/** Days until next occurrence of a birthday/anniversary (MM-DD or YYYY-MM-DD). */
export function daysUntilNextOccurrence(dateStr: string): number {
  const today = startOfDay(new Date());
  let month: number;
  let day: number;

  if (dateStr.length === 5) {
    // MM-DD
    [month, day] = dateStr.split('-').map(Number);
  } else {
    // YYYY-MM-DD
    const parsed = parseISO(dateStr);
    month = parsed.getMonth() + 1;
    day = parsed.getDate();
  }

  const thisYear = today.getFullYear();
  let candidate = new Date(thisYear, month - 1, day);
  if (isBefore(candidate, today)) {
    candidate = setYear(candidate, thisYear + 1);
  }
  return differenceInDays(candidate, today);
}

/** Days since a YYYY-MM-DD date string. */
export function daysSince(dateStr: string): number {
  const today = startOfDay(new Date());
  const past = startOfDay(parseISO(dateStr));
  return differenceInDays(today, past);
}

export function friendlyDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'MMM d, yyyy');
}

export function friendlyAgo(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
