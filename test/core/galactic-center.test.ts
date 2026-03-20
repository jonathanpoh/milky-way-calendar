import { describe, it, expect } from 'vitest';
import { getGalacticCenterData } from '../../src/core/galactic-center.js';
import { generateCalendar } from '../../src/core/calendar.js';

const PALMELA: import('../../src/core/types.js').Location = { lat: 38.563, lon: -8.882 };

describe('getGalacticCenterData', () => {
  it('GC is visible (rises and sets) in summer from Portugal', () => {
    const date = new Date(Date.UTC(2026, 5, 21)); // June solstice
    const data = getGalacticCenterData(PALMELA, date);
    expect(data.rise).toBeInstanceOf(Date);
    expect(data.set).toBeInstanceOf(Date);
    expect(data.transit).toBeInstanceOf(Date);
  });

  it('transit altitude is positive when GC is above horizon', () => {
    const date = new Date(Date.UTC(2026, 5, 21));
    const data = getGalacticCenterData(PALMELA, date);
    expect(data.transitAltitude).toBeGreaterThan(0);
  });

  it('transit altitude is less than 90 - lat + dec (approx upper bound)', () => {
    const date = new Date(Date.UTC(2026, 5, 21));
    const data = getGalacticCenterData(PALMELA, date);
    // Max altitude ≈ 90 - (38.563 - (-29.0078)) ≈ 22.4° for Palmela
    expect(data.transitAltitude).toBeLessThan(30);
    expect(data.transitAltitude).toBeGreaterThan(15);
  });

  it('calendar rows have non-empty position labels in summer', () => {
    // Position label is computed in calendar.ts over the MW window (not from getGalacticCenterData directly).
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 5, 21)),
      endDate: new Date(Date.UTC(2026, 5, 21)),
      interval: 1,
    });
    expect(rows[0]!.gc.positionLabel).toBeTruthy();
  });
});
