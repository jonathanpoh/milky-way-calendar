import { describe, it, expect } from 'vitest';
import { getGalacticCenterData } from '../../src/core/galactic-center.js';
import { generateCalendar } from '../../src/core/calendar.js';

import type { Location } from '../../src/core/types.js';

const PALMELA: Location = { lat: 38.563, lon: -8.882, timezone: 'Europe/Lisbon' };
const SYDNEY: Location  = { lat: -33.8623, lon: 151.2077, timezone: 'Australia/Sydney' };

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

describe('galactic-center eastern timezone regression', () => {
  // Sydney (UTC+10/+11): GC rises ~11:18 UTC in April, just before UTC noon.
  // The UTC-noon anchor caused the rise search to return tomorrow's rise,
  // making mwWindow null for the entire month. localNoonUTC anchor fixes this.
  it('Sydney April has MW visibility (GC rises before UTC noon)', () => {
    const rows = generateCalendar({
      location: SYDNEY,
      startDate: new Date(Date.UTC(2027, 3, 1)),  // April 1
      endDate:   new Date(Date.UTC(2027, 3, 10)), // April 10
      interval: 1,
    });
    const withMW = rows.filter(r => r.mwWindow !== null);
    expect(withMW.length).toBeGreaterThan(0);
  });

  it('GC rise is returned for the correct night (not tomorrow) for Sydney in April', () => {
    const date = new Date(Date.UTC(2027, 3, 5)); // April 5
    const data = getGalacticCenterData(SYDNEY, date);
    // GC rise should be on April 5 UTC (not April 6)
    expect(data.rise).toBeInstanceOf(Date);
    expect(data.rise!.getUTCDate()).toBe(5);
    expect(data.rise!.getUTCMonth()).toBe(3); // April
  });
});
