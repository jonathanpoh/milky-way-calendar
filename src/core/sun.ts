import A from './astronomy.js';
import type { Location, SunData, SunRegime, TimeWindow } from './types.js';
import { makeObserver } from './observer.js';
import { localNoonUTC } from './moon.js';

// Standard refracted altitude at which the sun's centre is considered to rise/set.
// Matches astronomy-engine's SearchRiseSet so regime classification agrees with it.
const SUN_HORIZON = -0.833;

function sunAltitude(observer: InstanceType<typeof A.Observer>, time: Date): number {
  const equ = A.Equator(A.Body.Sun, time, observer, true, true);
  return A.Horizon(time, observer, equ.ra, equ.dec, 'normal').altitude;
}

// Classify the day when the sun makes no clean horizon crossing, by sampling its
// daily altitude extremes: the upper culmination (≈ local noon) and lower
// culmination (≈ local midnight).
function classifyPolarRegime(
  observer: InstanceType<typeof A.Observer>,
  localNoon: Date,
): SunRegime {
  const upper = A.SearchHourAngle(A.Body.Sun, observer, 0, localNoon, +1);
  const lower = A.SearchHourAngle(A.Body.Sun, observer, 12, localNoon, +1);
  const maxAlt = upper ? sunAltitude(observer, upper.time.date) : sunAltitude(observer, localNoon);
  const minAlt = lower
    ? sunAltitude(observer, lower.time.date)
    : sunAltitude(observer, new Date(localNoon.getTime() + 12 * 3_600_000));

  if (minAlt > SUN_HORIZON) return 'polar-day';   // sun never sets
  if (maxAlt < SUN_HORIZON) return 'polar-night'; // sun never rises
  return 'normal'; // transition day: a (possibly very short) rise/set pair exists
}

export function getSunData(location: Location, date: Date): SunData {
  const observer = makeObserver(location);
  const localNoon = localNoonUTC(date, location.timezone);

  const sunset  = A.SearchRiseSet(A.Body.Sun, observer, -1, localNoon, 1, 0)?.date ?? null;
  const sunrise = A.SearchRiseSet(A.Body.Sun, observer, +1, localNoon, 1, 0)?.date ?? null;

  // A missing rise or set means a polar regime (or a polar transition day).
  // Only then do we pay for the extra culmination searches to classify.
  const regime: SunRegime =
    !sunset || !sunrise ? classifyPolarRegime(observer, localNoon) : 'normal';

  // Polar day (midnight sun): no horizon crossing and no darkness at all.
  if (regime === 'polar-day') {
    return {
      date, sunset: null, sunrise: null, regime,
      twilightEnd: null, twilightStart: null, darkWindow: null,
    };
  }

  // Evening twilight anchor: the sunset when there is one, otherwise local noon.
  // Local noon is used during polar night (the sun's daily peak — still below the
  // horizon — from which it descends toward midnight) and on polar transition
  // days where the brief daylight falls before noon, so SearchRiseSet finds no
  // sunset after it. Anchoring on local noon (never a fabricated sunset) keeps
  // the dark window on the night of `date`.
  const eveningAnchor = sunset ?? localNoon;

  const twilightEnd = A.SearchAltitude(A.Body.Sun, observer, -1, eveningAnchor, 1, -18)?.date ?? null;

  let twilightStart: Date | null = null;
  let darkWindow: TimeWindow | null = null;

  if (twilightEnd) {
    twilightStart = A.SearchAltitude(A.Body.Sun, observer, +1, twilightEnd, 12, -18)?.date ?? null;

    if (twilightStart && twilightStart.getTime() > twilightEnd.getTime()) {
      darkWindow = {
        start: twilightEnd,
        end: twilightStart,
        durationHours: (twilightStart.getTime() - twilightEnd.getTime()) / 3_600_000,
      };
    }
  } else if (regime === 'polar-night') {
    // Sun never climbs to -18° even at its daily peak: astronomically dark for
    // the entire 24h (very high latitudes near the solstice).
    const start = localNoon;
    const end = new Date(localNoon.getTime() + 24 * 3_600_000);
    darkWindow = { start, end, durationHours: 24 };
  }

  return { date, sunset, sunrise, regime, twilightEnd, twilightStart, darkWindow };
}
