import { describe, it, expect } from 'vitest';
import { getSunData } from '../../src/core/sun.js';

const PALMELA: import('../../src/core/types.js').Location = { lat: 38.563, lon: -8.882 };

describe('getSunData', () => {
  it('returns a valid dark window for a summer day', () => {
    const date = new Date(Date.UTC(2026, 5, 21)); // 21 Jun 2026
    const data = getSunData(PALMELA, date);

    expect(data.sunset).toBeInstanceOf(Date);
    expect(data.sunrise).toBeInstanceOf(Date);
    expect(data.twilightEnd).toBeInstanceOf(Date);
    expect(data.twilightStart).toBeInstanceOf(Date);

    // Twilight end must be after sunset
    expect(data.twilightEnd.getTime()).toBeGreaterThan(data.sunset.getTime());
    // Twilight start must be before sunrise
    expect(data.twilightStart.getTime()).toBeLessThan(data.sunrise.getTime());
    // Dark window is positive
    expect(data.darkWindow.durationHours).toBeGreaterThan(0);
  });

  it('returns a longer dark window in winter than summer', () => {
    const summer = getSunData(PALMELA, new Date(Date.UTC(2026, 5, 21)));
    const winter = getSunData(PALMELA, new Date(Date.UTC(2026, 11, 21)));
    expect(winter.darkWindow.durationHours).toBeGreaterThan(summer.darkWindow.durationHours);
  });

  it('sunset is in the evening (UTC hour 17–21 for Portugal)', () => {
    const date = new Date(Date.UTC(2026, 3, 1)); // April 2026
    const data = getSunData(PALMELA, date);
    const sunsetHour = data.sunset.getUTCHours();
    expect(sunsetHour).toBeGreaterThanOrEqual(17);
    expect(sunsetHour).toBeLessThanOrEqual(21);
  });
});
