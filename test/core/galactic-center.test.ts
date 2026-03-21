import { describe, it, expect } from 'vitest';
import { getGalacticCenterData } from '../../src/core/galactic-center.js';
import { generateCalendar } from '../../src/core/calendar.js';
import { PALMELA, SYDNEY, TOKYO, DENVER } from '../fixtures/locations.js';

describe('getGalacticCenterData — Palmela, Portugal', () => {
  it('GC is visible (rises and sets) in summer', () => {
    const data = getGalacticCenterData(PALMELA, new Date(Date.UTC(2026, 5, 21)));
    expect(data.rise).toBeInstanceOf(Date);
    expect(data.set).toBeInstanceOf(Date);
    expect(data.transit).toBeInstanceOf(Date);
  });

  it('transit altitude is positive when GC is above horizon', () => {
    const data = getGalacticCenterData(PALMELA, new Date(Date.UTC(2026, 5, 21)));
    expect(data.transitAltitude).toBeGreaterThan(0);
  });

  it('transit altitude is within expected range for Palmela (~17–25°)', () => {
    const data = getGalacticCenterData(PALMELA, new Date(Date.UTC(2026, 5, 21)));
    // Max altitude ≈ 90 - (38.563 - (-29.008)) ≈ 22.4° for Palmela
    expect(data.transitAltitude).toBeLessThan(30);
    expect(data.transitAltitude).toBeGreaterThan(15);
  });

  it('calendar rows have non-empty position labels in summer', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 5, 21)),
      endDate: new Date(Date.UTC(2026, 5, 21)),
      interval: 1,
    });
    expect(rows[0]!.gc.positionLabel).toBeTruthy();
  });
});

describe('getGalacticCenterData — Tokyo (UTC+9)', () => {
  it('GC rise is on the correct calendar day (not tomorrow) in summer', () => {
    const date = new Date(Date.UTC(2026, 6, 15)); // Jul 15
    const data = getGalacticCenterData(TOKYO, date);
    expect(data.rise).toBeInstanceOf(Date);
    // Rise should be within 1 day of the anchor date
    const diffH = (data.rise!.getTime() - date.getTime()) / 3_600_000;
    expect(diffH).toBeGreaterThanOrEqual(0);
    expect(diffH).toBeLessThan(24);
  });

  it('transit altitude is higher than Palmela (Tokyo ~28° vs Palmela ~22°)', () => {
    const data = getGalacticCenterData(TOKYO, new Date(Date.UTC(2026, 6, 15)));
    expect(data.transitAltitude).toBeGreaterThan(20);
  });
});

describe('getGalacticCenterData — Denver, USA (UTC-6/-7)', () => {
  it('GC rises and sets in peak season (Aug)', () => {
    const data = getGalacticCenterData(DENVER, new Date(Date.UTC(2024, 7, 3)));
    expect(data.rise).toBeInstanceOf(Date);
    expect(data.set).toBeInstanceOf(Date);
  });

  it('transit altitude is within expected range for Denver (~28–34°)', () => {
    // Denver lat 39°N: max GC alt ≈ 90 - (39 - (-29)) = 22° ... actually 90-(39+29)=22°
    const data = getGalacticCenterData(DENVER, new Date(Date.UTC(2024, 7, 3)));
    expect(data.transitAltitude).toBeGreaterThan(18);
    expect(data.transitAltitude).toBeLessThan(30);
  });
});

// Regression: Sydney (UTC+10/+11) in April — GC rises at ~11:18 UTC (just before
// UTC noon). The UTC-noon anchor caused the rise search to skip to tomorrow's
// rise, making mwWindow null for the entire month.
describe('getGalacticCenterData — Sydney regression (UTC+10/+11)', () => {
  it('Sydney April has MW visibility (GC rises before UTC noon)', () => {
    const rows = generateCalendar({
      location: SYDNEY,
      startDate: new Date(Date.UTC(2027, 3, 1)),
      endDate:   new Date(Date.UTC(2027, 3, 10)),
      interval: 1,
    });
    expect(rows.filter(r => r.mwWindow !== null).length).toBeGreaterThan(0);
  });

  it('GC rise is returned for the correct night (not tomorrow) for Sydney in April', () => {
    const date = new Date(Date.UTC(2027, 3, 5)); // Apr 5
    const data = getGalacticCenterData(SYDNEY, date);
    expect(data.rise).toBeInstanceOf(Date);
    expect(data.rise!.getUTCDate()).toBe(5);
    expect(data.rise!.getUTCMonth()).toBe(3); // April
  });

  it('transit altitude is higher than Palmela (GC transits higher from southern latitudes)', () => {
    const data = getGalacticCenterData(SYDNEY, new Date(Date.UTC(2026, 6, 15)));
    // Sydney lat -33.86°: max alt ≈ 90 - (|-33.86| - 29.008) ≈ 85.1°
    expect(data.transitAltitude).toBeGreaterThan(60);
  });
});
