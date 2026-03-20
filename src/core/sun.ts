import A from './astronomy.js';
import type { Location, SunData, TimeWindow } from './types.js';
import { makeObserver } from './observer.js';
import { localNoonUTC } from './moon.js';

export function getSunData(location: Location, date: Date): SunData {
  const observer = makeObserver(location);
  const localNoon = localNoonUTC(date, location.timezone);

  const sunsetResult = A.SearchRiseSet(A.Body.Sun, observer, -1, localNoon, 1, 0);
  const sunset = sunsetResult ? sunsetResult.date : new Date(localNoon.getTime() + 6 * 3600_000);

  const twilightEnd = A.SearchAltitude(A.Body.Sun, observer, -1, sunset, 1, -18)
    ?.date ?? new Date(sunset.getTime() + 1.5 * 3600_000);

  const sunriseResult = A.SearchRiseSet(A.Body.Sun, observer, +1, localNoon, 1, 0);
  const sunrise = sunriseResult ? sunriseResult.date : new Date(localNoon.getTime() + 6 * 3600_000);

  const twilightStart = A.SearchAltitude(A.Body.Sun, observer, +1, twilightEnd, 12, -18)
    ?.date ?? new Date(sunrise.getTime() - 1.5 * 3600_000);

  const darkWindow: TimeWindow = {
    start: twilightEnd,
    end: twilightStart,
    durationHours: (twilightStart.getTime() - twilightEnd.getTime()) / 3_600_000,
  };

  return { date, sunset, sunrise, twilightEnd, twilightStart, darkWindow };
}
