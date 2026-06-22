import { describe, it, expect } from 'vitest';
import { getMoonData } from '../../src/core/moon.js';
import { PALMELA, SYDNEY, TOKYO, DENVER } from '../fixtures/locations.js';

describe('getMoonData', () => {
  it('returns illumination between 0 and 100', () => {
    const data = getMoonData(PALMELA, new Date(Date.UTC(2026, 0, 14)));
    expect(data.illumination).toBeGreaterThanOrEqual(0);
    expect(data.illumination).toBeLessThanOrEqual(100);
  });

  it('returns phase angle between 0 and 360 (MoonPhase convention)', () => {
    const data = getMoonData(PALMELA, new Date(Date.UTC(2026, 0, 14)));
    expect(data.phaseAngle).toBeGreaterThanOrEqual(0);
    expect(data.phaseAngle).toBeLessThan(360);
  });

  it('illumination is near 0 around new moon (Jan 18 2026)', () => {
    // Actual new moon: 2026-01-18T19:52Z
    const data = getMoonData(PALMELA, new Date(Date.UTC(2026, 0, 18)));
    expect(data.illumination).toBeLessThan(5);
  });

  it('illumination is near 100 around full moon (Jan 3 2026)', () => {
    // Actual full moon: 2026-01-03T10:03Z
    const data = getMoonData(PALMELA, new Date(Date.UTC(2026, 0, 3)));
    expect(data.illumination).toBeGreaterThan(95);
  });

  it('phase angle is near 0 around new moon (MoonPhase convention)', () => {
    const data = getMoonData(PALMELA, new Date(Date.UTC(2026, 0, 18)));
    // MoonPhase: 0=new, so near 0° or near 360°
    const nearNew = data.phaseAngle < 20 || data.phaseAngle > 340;
    expect(nearNew).toBe(true);
  });

  it('phase angle is near 180 around full moon (MoonPhase convention)', () => {
    const data = getMoonData(PALMELA, new Date(Date.UTC(2026, 0, 3)));
    expect(data.phaseAngle).toBeGreaterThan(160);
    expect(data.phaseAngle).toBeLessThan(200);
  });
});

// Moon phase/illumination is geocentric — all locations return the same values
// for the same date. These smoke tests confirm the function runs correctly for
// each timezone and that moonrise/moonset are returned as valid types.
describe('getMoonData — location smoke tests (Sydney, Tokyo, Denver)', () => {
  const newMoon = new Date(Date.UTC(2026, 0, 18)); // 2026-01-18 new moon

  for (const [name, loc] of [['Sydney', SYDNEY], ['Tokyo', TOKYO], ['Denver', DENVER]] as const) {
    it(`${name}: illumination and phase angle are in valid ranges`, () => {
      const data = getMoonData(loc, newMoon);
      expect(data.illumination).toBeGreaterThanOrEqual(0);
      expect(data.illumination).toBeLessThanOrEqual(100);
      expect(data.phaseAngle).toBeGreaterThanOrEqual(0);
      expect(data.phaseAngle).toBeLessThan(360);
    });

    it(`${name}: illumination is near 0 on new moon day (geocentric, sampled at local noon)`, () => {
      // getMoonData samples at localNoonUTC which varies by timezone, so values
      // differ slightly between locations but should all be near 0 on new moon day.
      const data = getMoonData(loc, newMoon);
      expect(data.illumination).toBeLessThan(5);
    });

    it(`${name}: moonrise and moonset are Date or null`, () => {
      const data = getMoonData(loc, newMoon);
      expect(data.moonrise === null || data.moonrise instanceof Date).toBe(true);
      expect(data.moonset  === null || data.moonset  instanceof Date).toBe(true);
    });
  }
});

describe('getMoonData — +1 flag uses local midnight, not UTC', () => {
  it('Denver: same-evening event in UTC next-day is not flagged +1', () => {
    // Denver MDT = UTC-6. An event at 02:00 UTC is 20:00 local (same evening).
    // The old code compared against UTC midnight and would flag it +1.
    const data = getMoonData(DENVER, new Date(Date.UTC(2026, 6, 15)));
    if (data.moonrise && data.moonrise.getUTCHours() >= 0 && data.moonrise.getUTCHours() < 6) {
      expect(data.moonriseNextDay).toBe(false);
    }
  });

  it('genuine post-local-midnight event is flagged +1', () => {
    // Find a date where moonrise occurs after local midnight for Palmela.
    // Around full moon in winter, moon rises late.
    const data = getMoonData(PALMELA, new Date(Date.UTC(2026, 0, 5)));
    if (data.moonrise) {
      const localH = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', hour12: false, timeZone: 'Europe/Lisbon',
      }).formatToParts(data.moonrise).find(p => p.type === 'hour')!.value;
      const h = parseInt(localH) % 24;
      // If moonrise is in the AM local hours (0-11), it should be +1
      if (h < 12) expect(data.moonriseNextDay).toBe(true);
    }
  });
});
