import A from './astronomy.js';
import type { Location, SunData, TimeWindow } from './types.js';
import { makeObserver } from './observer.js';

export function getSunData(location: Location, date: Date): SunData {
  const observer = makeObserver(location);
  const noon = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
  const midnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0));

  const sunsetResult = A.SearchRiseSet(A.Body.Sun, observer, -1, midnight, 1, 0);
  const sunset = sunsetResult ? sunsetResult.date : new Date(noon.getTime() + 6 * 3600_000);

  const twilightEnd = A.SearchAltitude(A.Body.Sun, observer, -1, sunset, 1, -18)
    ?.date ?? new Date(sunset.getTime() + 1.5 * 3600_000);

  const sunriseResult = A.SearchRiseSet(A.Body.Sun, observer, +1, noon, 1, 0);
  const sunrise = sunriseResult ? sunriseResult.date : new Date(noon.getTime() + 6 * 3600_000);

  const twilightStart = A.SearchAltitude(A.Body.Sun, observer, +1, twilightEnd, 12, -18)
    ?.date ?? new Date(sunrise.getTime() - 1.5 * 3600_000);

  const darkWindow: TimeWindow = {
    start: twilightEnd,
    end: twilightStart,
    durationHours: (twilightStart.getTime() - twilightEnd.getTime()) / 3_600_000,
  };

  return { date, sunset, sunrise, twilightEnd, twilightStart, darkWindow };
}
