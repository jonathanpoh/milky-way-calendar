import A from './astronomy.js';
import type { Location, MoonData } from './types.js';
import { makeObserver } from './observer.js';

// Returns the UTC instant when the local clock reads 12:00 on the given UTC date.
// Anchoring to local noon ensures moonrise/moonset searches always start before
// the night window regardless of timezone (e.g. Tokyo UTC+9: noon UTC = 21:00 JST,
// which is already past sunset and misses afternoon/early-evening moon events).
function localNoonUTC(date: Date, timezone?: string): Date {
  const noonUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
  if (!timezone) return noonUTC;
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
  }).formatToParts(noonUTC);
  const localH = parseInt(parts.find(p => p.type === 'hour')!.value) % 24;
  const localM = parseInt(parts.find(p => p.type === 'minute')!.value);
  const diffMs = (12 * 60 - (localH * 60 + localM)) * 60_000;
  return new Date(noonUTC.getTime() + diffMs);
}

export function getMoonData(location: Location, date: Date): MoonData {
  const observer = makeObserver(location);

  // Anchor search to local noon so the 2-day window covers the full night
  // regardless of timezone. UTC noon fails for eastern zones (UTC+9 etc.)
  // where noon UTC falls after local sunset, missing same-day moon events.
  const noonUTC = localNoonUTC(date, location.timezone);
  const nextMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));

  // Moonrise: first rise after noon UTC
  let moonriseNextDay = false;
  let moonrise: Date | null = null;
  const mrResult = A.SearchRiseSet(A.Body.Moon, observer, +1, noonUTC, 2, 0);
  if (mrResult) {
    moonrise = mrResult.date;
    moonriseNextDay = moonrise >= nextMidnight;
  }

  // Moonset: first set after noon UTC
  let moonsetNextDay = false;
  let moonset: Date | null = null;
  const msResult = A.SearchRiseSet(A.Body.Moon, observer, -1, noonUTC, 2, 0);
  if (msResult) {
    moonset = msResult.date;
    moonsetNextDay = moonset >= nextMidnight;
  }

  // Illumination and phase at noon UTC
  const illum = A.Illumination(A.Body.Moon, noonUTC);
  const illumination = Math.round(illum.phase_fraction * 100);
  // MoonPhase: ecliptic longitude difference. 0/360=new moon, 180=full moon.
  const phaseAngle = A.MoonPhase(noonUTC);

  return { date, moonrise, moonset, illumination, phaseAngle, moonriseNextDay, moonsetNextDay };
}
