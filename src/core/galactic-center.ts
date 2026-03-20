import A from './astronomy.js';
import type { Location, GalacticCenterData } from './types.js';
import { makeObserver } from './observer.js';

// Sgr A* (Galactic Center) J2000 coordinates
// RA: 17h 45m 40.04s ≈ 17.7611 hours; Dec: -29° 00' 28.1" ≈ -29.0078°
const GC_RA_HOURS = 17.7611;
const GC_DEC_DEG = -29.0078;
const GC_DISTANCE_LY = 26000;

let gcRegistered = false;

export function ensureGCRegistered() {
  if (!gcRegistered) {
    A.DefineStar(A.Body.Star1, GC_RA_HOURS, GC_DEC_DEG, GC_DISTANCE_LY);
    gcRegistered = true;
  }
}

export function gcAltitude(observer: InstanceType<typeof A.Observer>, time: Date): number {
  const equ = A.Equator(A.Body.Star1, time, observer, true, true);
  const hor = A.Horizon(time, observer, equ.ra, equ.dec, 'normal');
  return hor.altitude;
}

export function buildPositionLabel(
  observer: InstanceType<typeof A.Observer>,
  windowStart: Date,
  windowEnd: Date,
): string {
  const samples: number[] = [];
  const step = 15 * 60_000;
  for (let t = windowStart.getTime(); t <= windowEnd.getTime(); t += step) {
    samples.push(gcAltitude(observer, new Date(t)));
  }
  if (samples.length === 0) return '';

  const minAlt = Math.round(Math.min(...samples));
  const maxAlt = Math.round(Math.max(...samples));

  if (maxAlt < 45) return `Arch (${maxAlt}°)`;
  if (minAlt > 60) return `Vertical (${minAlt}°)`;
  return `Arch (${minAlt}°) - Vertical (${maxAlt}°)`;
}

export function getGalacticCenterData(location: Location, date: Date): GalacticCenterData {
  ensureGCRegistered();
  const observer = makeObserver(location);

  // Use noon UTC as anchor to avoid picking up previous-night events when UTC midnight
  // falls mid-night for western timezones.
  const noonUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));

  // Rise: first rise after noon UTC
  const riseResult = A.SearchRiseSet(A.Body.Star1, observer, +1, noonUTC, 1, 0);
  const rise = riseResult?.date ?? null;

  // Set: first set AFTER the rise (same night)
  let set: Date | null = null;
  if (rise) {
    const setResult = A.SearchRiseSet(A.Body.Star1, observer, -1, rise, 1, 0);
    set = setResult?.date ?? null;
  }

  // Transit: upper culmination after noon UTC
  const transitResult = A.SearchHourAngle(A.Body.Star1, observer, 0, noonUTC, +1);
  const transit = transitResult?.time.date ?? null;
  const transitAltitude = transit ? Math.round(gcAltitude(observer, transit)) : 0;

  // positionLabel will be recomputed from the MW window in calendar.ts
  // (using the full rise→set arc here includes daytime hours and inflates the max altitude)
  const positionLabel = '';

  return { date, rise, set, transit, transitAltitude, positionLabel };
}
