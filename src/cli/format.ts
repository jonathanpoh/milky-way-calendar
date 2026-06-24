// Shared CLI formatting helpers.
//
// Time-of-day values (sunset, window start/end) are real instants and are
// formatted in the display timezone. Calendar dates (row.date) are UTC-anchored
// midnight markers with no time-of-day meaning — they must always be formatted
// in UTC, otherwise negative-offset timezones (the Americas) render the label as
// the previous day.

/** Format an instant as HH:MM in the given display timezone. */
export function formatTime(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
  }).format(d);
}

/** Format a UTC-anchored calendar date as e.g. "01 Jun". */
export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', timeZone: 'UTC',
  }).format(d);
}

/** Format a UTC-anchored calendar date as YYYY-MM-DD. */
export function formatDateISO(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'UTC' }).format(d);
}

/** Format a UTC-anchored calendar date's month as e.g. "June 2026". */
export function formatMonth(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(d);
}

/** Format a duration in hours as e.g. "3h", "3h45m", or "—" when zero/absent. */
export function formatDuration(hours: number | undefined): string {
  if (!hours || hours <= 0) return '—';
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}
