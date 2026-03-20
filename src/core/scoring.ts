import type { Location, MoonData, TimeWindow, VisibilityRating } from './types.js';
import { moonAboveHorizonFraction } from './milky-way.js';

export function scoreNight(
  location: Location,
  mwWindow: TimeWindow | null,
  gcClearWindow: TimeWindow | null,
  moon: MoonData,
): VisibilityRating {
  if (!mwWindow || mwWindow.durationHours <= 0) return 'not-visible';

  const clearHours = gcClearWindow?.durationHours ?? 0;

  // Use the GC clear window for moon interference check (if available).
  // Falling back to the MW window keeps scoring correct for short-visibility nights.
  const checkWindow = gcClearWindow ?? mwWindow;

  // Fraction of the check window where the moon is above the horizon.
  // This bypasses moonrise/moonset timing bugs and handles edge cases correctly.
  const moonFrac = moonAboveHorizonFraction(location, checkWindow);

  // "Best" requires:
  //   - At least 2 hours of GC clearly above 10° (proper shooting time)
  //   - Low moon interference: dim moon (<25%) OR moon below horizon for >75% of the window
  const moonOk = moon.illumination < 25 || moonFrac < 0.25;

  if (clearHours >= 2 && moonOk) return 'best';
  if (mwWindow.durationHours > 0) return 'partial';
  return 'not-visible';
}
