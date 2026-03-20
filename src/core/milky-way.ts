import A from './astronomy.js';
import type { Location, SunData, GalacticCenterData, TimeWindow } from './types.js';
import { makeObserver } from './observer.js';
import { ensureGCRegistered, gcAltitude } from './galactic-center.js';

const MIN_GC_ALT = 10;
const CLEAR_STEP_MS = 2 * 60_000; // 2-min sampling only for the altitude>10° sub-window

export function getMwWindows(
  location: Location,
  sun: SunData,
  gc: GalacticCenterData,
): { mwWindow: TimeWindow | null; gcClearWindow: TimeWindow | null } {
  ensureGCRegistered();
  const dark = sun.darkWindow;

  if (dark.durationHours <= 0) {
    return { mwWindow: null, gcClearWindow: null };
  }

  // MW window = intersection of astronomical darkness with GC above the horizon.
  // Two cases must be handled:
  //
  //  A) GC is already above the horizon when darkness begins (common in summer for
  //     eastern timezones: the GC rose before noon UTC, so getGalacticCenterData's
  //     noon-UTC-anchored SearchRiseSet returns tomorrow's rise, not tonight's).
  //     → MW starts at dark.start; find the actual set from there.
  //
  //  B) GC rises during the dark window.
  //     → Use the pre-computed gc.rise / gc.set boundaries directly (avoids the
  //     10-minute sampling aliasing that caused the Jan 19–21 Alqueva anomaly).

  const observer = makeObserver(location);
  const darkStartT = dark.start.getTime();
  const darkEndT   = dark.end.getTime();

  let mwStartT: number;
  let mwEndT: number;

  const altAtDarkStart = gcAltitude(observer, dark.start);
  if (altAtDarkStart > 0) {
    // Case A: GC already up — MW begins at dark start, ends when GC sets.
    mwStartT = darkStartT;
    const setResult = A.SearchRiseSet(A.Body.Star1, observer, -1, dark.start, 1, 0);
    mwEndT = Math.min(darkEndT, setResult ? setResult.date.getTime() : Infinity);
  } else {
    // Case B: GC not yet up — use pre-computed rise/set.
    const gcRiseT = gc.rise ? gc.rise.getTime() : -Infinity;
    const gcSetT  = gc.set  ? gc.set.getTime()  :  Infinity;
    mwStartT = Math.max(darkStartT, gcRiseT);
    mwEndT   = Math.min(darkEndT,   gcSetT);
  }

  if (mwStartT >= mwEndT) {
    return { mwWindow: null, gcClearWindow: null };
  }

  const mwWindow: TimeWindow = {
    start: new Date(mwStartT),
    end:   new Date(mwEndT),
    durationHours: (mwEndT - mwStartT) / 3_600_000,
  };

  // GC clear window: subset of mwWindow where altitude > MIN_GC_ALT.
  // Still needs sampling since there is no closed-form crossing time for a
  // specific altitude threshold.
  let clearStart: Date | null = null;
  let clearEnd:   Date | null = null;

  for (let t = mwStartT; t <= mwEndT; t += CLEAR_STEP_MS) {
    if (gcAltitude(observer, new Date(t)) >= MIN_GC_ALT) {
      if (!clearStart) clearStart = new Date(t);
      clearEnd = new Date(t);
    }
  }

  const gcClearWindow =
    clearStart && clearEnd
      ? { start: clearStart, end: clearEnd, durationHours: (clearEnd.getTime() - clearStart.getTime()) / 3_600_000 }
      : null;

  return { mwWindow, gcClearWindow };
}

/**
 * Sample the moon's altitude every 15 min across `window` and return the
 * fraction of samples where the moon is above the horizon (0–1).
 * More robust than moonrise/moonset time comparisons, which can return
 * events from the wrong night due to UTC-midnight anchor ambiguity.
 */
export function moonAboveHorizonFraction(location: Location, window: TimeWindow): number {
  const observer = makeObserver(location);
  const step = 15 * 60_000;
  let above = 0;
  let total = 0;

  for (let t = window.start.getTime(); t <= window.end.getTime(); t += step) {
    const equ = A.Equator(A.Body.Moon, new Date(t), observer, true, true);
    const hor = A.Horizon(new Date(t), observer, equ.ra, equ.dec, 'normal');
    if (hor.altitude > 0) above++;
    total++;
  }

  return total > 0 ? above / total : 0;
}
