import { describe, it, expect } from 'vitest';
import { getSunData } from '../../src/core/sun.js';
import { PALMELA, SYDNEY, TOKYO, DENVER } from '../fixtures/locations.js';

describe('getSunData — Palmela, Portugal (UTC+0/+1)', () => {
  it('returns a valid dark window for a summer day', () => {
    const data = getSunData(PALMELA, new Date(Date.UTC(2026, 5, 21))); // Jun 21
    expect(data.sunset).toBeInstanceOf(Date);
    expect(data.sunrise).toBeInstanceOf(Date);
    expect(data.twilightEnd.getTime()).toBeGreaterThan(data.sunset.getTime());
    expect(data.twilightStart.getTime()).toBeLessThan(data.sunrise.getTime());
    expect(data.darkWindow.durationHours).toBeGreaterThan(0);
  });

  it('returns a longer dark window in winter than summer', () => {
    const summer = getSunData(PALMELA, new Date(Date.UTC(2026, 5, 21)));
    const winter = getSunData(PALMELA, new Date(Date.UTC(2026, 11, 21)));
    expect(winter.darkWindow.durationHours).toBeGreaterThan(summer.darkWindow.durationHours);
  });

  it('sunset is in the evening local time (UTC 17–21) for Portugal in April', () => {
    const data = getSunData(PALMELA, new Date(Date.UTC(2026, 3, 1)));
    expect(data.sunset.getUTCHours()).toBeGreaterThanOrEqual(17);
    expect(data.sunset.getUTCHours()).toBeLessThanOrEqual(21);
  });
});

describe('getSunData — Sydney, Australia (UTC+10/+11)', () => {
  it('sunset is in UTC morning (06–10 UTC) for Sydney in April', () => {
    // Sydney AEST (UTC+10): ~18:00 local = ~08:00 UTC
    const data = getSunData(SYDNEY, new Date(Date.UTC(2026, 3, 1)));
    expect(data.sunset.getUTCHours()).toBeGreaterThanOrEqual(6);
    expect(data.sunset.getUTCHours()).toBeLessThanOrEqual(10);
  });

  it('dark window is positive for Sydney in July (southern-hemisphere winter, long nights)', () => {
    const data = getSunData(SYDNEY, new Date(Date.UTC(2026, 6, 1)));
    expect(data.darkWindow.durationHours).toBeGreaterThan(5);
  });

  it('southern hemisphere: winter (Jul) has longer dark window than summer (Jan)', () => {
    const summer = getSunData(SYDNEY, new Date(Date.UTC(2026, 0, 15))); // Jan
    const winter = getSunData(SYDNEY, new Date(Date.UTC(2026, 6, 15))); // Jul
    expect(winter.darkWindow.durationHours).toBeGreaterThan(summer.darkWindow.durationHours);
  });

  it('twilight ordering is correct', () => {
    const data = getSunData(SYDNEY, new Date(Date.UTC(2026, 3, 15)));
    expect(data.sunset.getTime()).toBeLessThan(data.twilightEnd.getTime());
    expect(data.twilightEnd.getTime()).toBeLessThan(data.twilightStart.getTime());
    expect(data.twilightStart.getTime()).toBeLessThan(data.sunrise.getTime());
  });
});

describe('getSunData — Denver, USA (UTC-6/-7)', () => {
  it('sunset is in UTC late-evening / early-morning (00–04 UTC) in summer', () => {
    // Denver MDT (UTC-6): ~20:30 local = ~02:30 UTC
    const data = getSunData(DENVER, new Date(Date.UTC(2024, 6, 15)));
    const h = data.sunset.getUTCHours();
    expect(h >= 0 && h <= 4).toBe(true);
  });

  it('dark window is positive in summer', () => {
    const data = getSunData(DENVER, new Date(Date.UTC(2024, 6, 15)));
    expect(data.darkWindow.durationHours).toBeGreaterThan(0);
  });

  it('winter has longer dark window than summer', () => {
    const summer = getSunData(DENVER, new Date(Date.UTC(2024, 5, 21)));
    const winter = getSunData(DENVER, new Date(Date.UTC(2024, 11, 21)));
    expect(winter.darkWindow.durationHours).toBeGreaterThan(summer.darkWindow.durationHours);
  });
});

describe('getSunData — Tokyo, Japan (UTC+9)', () => {
  it('sunset is in UTC morning (07–12 UTC) for Tokyo in summer', () => {
    // Tokyo JST (UTC+9): ~19:00 local = ~10:00 UTC
    const data = getSunData(TOKYO, new Date(Date.UTC(2026, 6, 15)));
    expect(data.sunset.getUTCHours()).toBeGreaterThanOrEqual(7);
    expect(data.sunset.getUTCHours()).toBeLessThanOrEqual(12);
  });

  it('dark window is positive in summer', () => {
    const data = getSunData(TOKYO, new Date(Date.UTC(2026, 6, 15)));
    expect(data.darkWindow.durationHours).toBeGreaterThan(0);
  });
});
