import { writable, derived } from 'svelte/store';
import type { CalendarOptions, CalendarRow, Location } from '../../core/types.js';
import { generateCalendar } from '../../core/calendar.js';

export const location = writable<Location>({
  lat: 38.1799,
  lon: -7.5897,
  name: 'Alqueva Dark Sky Reserve, Portugal',
  timezone: 'Europe/Lisbon',
});

/** UTC midnight of the local "today". */
export function todayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

// The first night shown in the table; defaults to today.
export const startDate = writable<Date>(todayUTC());

// The calendar is generated a full year at a time. Track the start date's year
// and only update (and thus regenerate) when the year actually changes — so
// stepping through months/dates within a year is cheap.
export const year = writable<number>(new Date().getFullYear());
startDate.subscribe((d) => {
  const y = d.getUTCFullYear();
  year.update((cur) => (cur !== y ? y : cur));
});

export const calendarRows = derived(
  [location, year],
  ([$location, $year]): CalendarRow[] => {
    const opts: CalendarOptions = {
      location: $location,
      startDate: new Date(Date.UTC($year, 0, 1)),
      endDate: new Date(Date.UTC($year, 11, 31)),
      interval: 1,
    };
    return generateCalendar(opts);
  },
);
