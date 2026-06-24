import type { CalendarRow, TimeWindow } from '../core/types.js';
import { moonEmoji } from './emoji.js';
import { formatTime, formatDateISO } from './format.js';

function fmtTime(d: Date | null, tz: string): string | null {
  if (!d) return null;
  return formatTime(d, tz);
}

function serializeWindow(win: TimeWindow | null, tz: string) {
  if (!win) return null;
  return { start: fmtTime(win.start, tz), end: fmtTime(win.end, tz), durationHours: +win.durationHours.toFixed(2) };
}

export function serializeRows(rows: CalendarRow[], tz: string) {
  return rows.map(r => ({
    date: formatDateISO(r.date),
    rating: r.rating,
    shootingWindow: serializeWindow(r.shootingWindow, tz),
    moon: {
      illumination: r.moon.illumination,
      phaseAngle: +r.moon.phaseAngle.toFixed(1),
      emoji: moonEmoji(r.moon.phaseAngle),
    },
    sun: {
      sunset: fmtTime(r.sun.sunset, tz),
      darkFrom: fmtTime(r.sun.twilightEnd, tz),
      darkUntil: fmtTime(r.sun.twilightStart, tz),
    },
    gc: {
      rise: fmtTime(r.gc.rise, tz),
      set: fmtTime(r.gc.set, tz),
      transit: fmtTime(r.gc.transit, tz),
      position: r.gc.positionLabel || null,
    },
    mwWindow: serializeWindow(r.mwWindow, tz),
    gcClearWindow: serializeWindow(r.gcClearWindow, tz),
  }));
}
