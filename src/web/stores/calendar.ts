import { writable, derived } from 'svelte/store';
import type { CalendarOptions, CalendarRow, Location } from '../../core/types.js';
import { generateCalendar } from '../../core/calendar.js';

export const location = writable<Location>({
  lat: 38.1799,
  lon: -7.5897,
  name: 'Alqueva Dark Sky Reserve, Portugal',
  timezone: 'Europe/Lisbon',
});

export const year = writable<number>(new Date().getFullYear());

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
