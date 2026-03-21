import { describe, it, expect } from 'vitest';
import { getMwWindows, moonAboveHorizonFraction } from '../../src/core/milky-way.js';
import { getSunData } from '../../src/core/sun.js';
import { getGalacticCenterData } from '../../src/core/galactic-center.js';
import { PALMELA, SYDNEY, TOKYO, DENVER } from '../fixtures/locations.js';

describe('getMwWindows — Palmela, Portugal', () => {
  it('returns a MW window in summer (GC visible during dark hours)', () => {
    const date = new Date(Date.UTC(2026, 6, 15));
    const sun = getSunData(PALMELA, date);
    const gc = getGalacticCenterData(PALMELA, date);
    const { mwWindow } = getMwWindows(PALMELA, sun, gc);
    expect(mwWindow).not.toBeNull();
    expect(mwWindow!.durationHours).toBeGreaterThan(0);
  });

  it('mwWindow duration is <= dark window duration', () => {
    const date = new Date(Date.UTC(2026, 6, 15));
    const sun = getSunData(PALMELA, date);
    const gc = getGalacticCenterData(PALMELA, date);
    const { mwWindow } = getMwWindows(PALMELA, sun, gc);
    expect(mwWindow!.durationHours).toBeLessThanOrEqual(sun.darkWindow.durationHours + 0.1);
  });

  it('gcClearWindow is null or <= mwWindow', () => {
    const date = new Date(Date.UTC(2026, 6, 15));
    const sun = getSunData(PALMELA, date);
    const gc = getGalacticCenterData(PALMELA, date);
    const { mwWindow, gcClearWindow } = getMwWindows(PALMELA, sun, gc);
    if (gcClearWindow) {
      expect(gcClearWindow.durationHours).toBeLessThanOrEqual(mwWindow!.durationHours + 0.1);
    }
  });
});

// Regression: eastern timezone (UTC+9) in summer — GC rises before noon UTC so
// getGalacticCenterData returns the *next day's* rise. getMwWindows must detect
// that the GC is already above the horizon when darkness begins and find its set
// from there, rather than incorrectly returning null.
describe('getMwWindows — Tokyo regression (UTC+9)', () => {
  it('returns MW visibility in June (GC already up at dark start)', () => {
    const date = new Date(Date.UTC(2026, 5, 15));
    const sun = getSunData(TOKYO, date);
    const gc  = getGalacticCenterData(TOKYO, date);
    const { mwWindow } = getMwWindows(TOKYO, sun, gc);
    expect(mwWindow).not.toBeNull();
    expect(mwWindow!.durationHours).toBeGreaterThan(1);
  });

  it('returns MW visibility in July (peak summer)', () => {
    const date = new Date(Date.UTC(2026, 6, 15));
    const sun = getSunData(TOKYO, date);
    const gc  = getGalacticCenterData(TOKYO, date);
    const { mwWindow } = getMwWindows(TOKYO, sun, gc);
    expect(mwWindow).not.toBeNull();
    expect(mwWindow!.durationHours).toBeGreaterThan(2);
  });

  it('returns no MW visibility in deep winter when GC only rises during daylight', () => {
    const date = new Date(Date.UTC(2026, 0, 15));
    const sun = getSunData(TOKYO, date);
    const gc  = getGalacticCenterData(TOKYO, date);
    const { mwWindow } = getMwWindows(TOKYO, sun, gc);
    if (mwWindow) {
      expect(mwWindow.durationHours).toBeLessThan(0.5);
    }
  });

  it('mwWindow is always within the dark window bounds', () => {
    for (const month of [0, 3, 5, 6, 8, 11]) {
      const date = new Date(Date.UTC(2026, month, 15));
      const sun = getSunData(TOKYO, date);
      const gc  = getGalacticCenterData(TOKYO, date);
      const { mwWindow } = getMwWindows(TOKYO, sun, gc);
      if (mwWindow) {
        expect(mwWindow.start.getTime()).toBeGreaterThanOrEqual(sun.darkWindow.start.getTime() - 1000);
        expect(mwWindow.end.getTime()).toBeLessThanOrEqual(sun.darkWindow.end.getTime() + 1000);
      }
    }
  });
});

// Regression: Sydney (UTC+10/+11) in April — GC rises at ~11:18 UTC (just before
// UTC noon), causing the UTC-noon anchor to return tomorrow's rise. Fixed by
// using localNoonUTC in getGalacticCenterData.
describe('getMwWindows — Sydney regression (UTC+10/+11)', () => {
  it('returns MW visibility in April (GC rises before UTC noon)', () => {
    const date = new Date(Date.UTC(2027, 3, 5)); // Apr 5 2027
    const sun = getSunData(SYDNEY, date);
    const gc  = getGalacticCenterData(SYDNEY, date);
    const { mwWindow } = getMwWindows(SYDNEY, sun, gc);
    expect(mwWindow).not.toBeNull();
    expect(mwWindow!.durationHours).toBeGreaterThan(1);
  });

  it('returns MW visibility in July (southern winter, GC high)', () => {
    const date = new Date(Date.UTC(2026, 6, 15));
    const sun = getSunData(SYDNEY, date);
    const gc  = getGalacticCenterData(SYDNEY, date);
    const { mwWindow } = getMwWindows(SYDNEY, sun, gc);
    expect(mwWindow).not.toBeNull();
    expect(mwWindow!.durationHours).toBeGreaterThan(2);
  });

  it('mwWindow is within the dark window bounds across key months', () => {
    for (const month of [0, 3, 6, 9]) {
      const date = new Date(Date.UTC(2026, month, 15));
      const sun = getSunData(SYDNEY, date);
      const gc  = getGalacticCenterData(SYDNEY, date);
      const { mwWindow } = getMwWindows(SYDNEY, sun, gc);
      if (mwWindow) {
        expect(mwWindow.start.getTime()).toBeGreaterThanOrEqual(sun.darkWindow.start.getTime() - 1000);
        expect(mwWindow.end.getTime()).toBeLessThanOrEqual(sun.darkWindow.end.getTime() + 1000);
      }
    }
  });
});

describe('getMwWindows — Denver, USA (UTC-6/-7)', () => {
  it('returns MW visibility in peak season (Aug)', () => {
    const date = new Date(Date.UTC(2024, 7, 3)); // Aug 3 2024
    const sun = getSunData(DENVER, date);
    const gc  = getGalacticCenterData(DENVER, date);
    const { mwWindow } = getMwWindows(DENVER, sun, gc);
    expect(mwWindow).not.toBeNull();
    expect(mwWindow!.durationHours).toBeGreaterThan(1);
  });

  it('returns no MW window in winter (Dec)', () => {
    const date = new Date(Date.UTC(2024, 11, 15));
    const sun = getSunData(DENVER, date);
    const gc  = getGalacticCenterData(DENVER, date);
    const { mwWindow } = getMwWindows(DENVER, sun, gc);
    expect(mwWindow).toBeNull();
  });
});

describe('moonAboveHorizonFraction', () => {
  const mwWindow = {
    start: new Date('2026-07-02T22:00:00Z'),
    end: new Date('2026-07-03T04:00:00Z'),
    durationHours: 6,
  };

  it('returns a fraction between 0 and 1', () => {
    const frac = moonAboveHorizonFraction(PALMELA, mwWindow);
    expect(frac).toBeGreaterThanOrEqual(0);
    expect(frac).toBeLessThanOrEqual(1);
  });

  it('returns near 1.0 for Jul 2 2026 (94% moon rises at start of dark window)', () => {
    const frac = moonAboveHorizonFraction(PALMELA, mwWindow);
    expect(frac).toBeGreaterThan(0.7);
  });

  it('returns near 0 around new moon (Jan 18 2026)', () => {
    const sun = getSunData(PALMELA, new Date(Date.UTC(2026, 0, 18)));
    const frac = moonAboveHorizonFraction(PALMELA, sun.darkWindow);
    expect(frac).toBeLessThan(0.3);
  });
});
