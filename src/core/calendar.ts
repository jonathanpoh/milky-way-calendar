import type { CalendarOptions, CalendarRow } from './types.js';
import { getSunData } from './sun.js';
import { getMoonData } from './moon.js';
import { getGalacticCenterData, buildPositionLabel, gcAltitude } from './galactic-center.js';
import { getMwWindows } from './milky-way.js';
import { scoreNight } from './scoring.js';
import { makeObserver } from './observer.js';

export function generateCalendar(options: CalendarOptions): CalendarRow[] {
  const { location, startDate, endDate, interval = 1 } = options;
  const observer = makeObserver(location);
  const rows: CalendarRow[] = [];

  let current = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  ));
  const end = new Date(Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  ));

  while (current <= end) {
    const date = new Date(current);
    const sun = getSunData(location, date);
    const moon = getMoonData(location, date);
    const gc = getGalacticCenterData(location, date);
    const { mwWindow, gcClearWindow } = getMwWindows(location, sun, gc);

    // Compute position label over the actual dark visibility window, not the
    // full rise→set arc (which includes daytime hours and always finds peak transit altitude).
    // Using the MW window shows the GC's altitude range during the shooting window.
    if (mwWindow) {
      gc.positionLabel = buildPositionLabel(observer, mwWindow.start, mwWindow.end);
    }

    const rating = scoreNight(location, mwWindow, gcClearWindow, moon);

    rows.push({ date, sun, moon, gc, mwWindow, gcClearWindow, rating });

    current = new Date(Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate() + interval,
    ));
  }

  return rows;
}
