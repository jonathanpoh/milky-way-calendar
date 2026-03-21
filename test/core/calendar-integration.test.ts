import { describe, it, expect } from 'vitest';
import { generateCalendar } from '../../src/core/calendar.js';
import { PALMELA, SYDNEY, TOKYO, DENVER } from '../fixtures/locations.js';
import midwestRef from '../fixtures/midwest-2024-reference.json';

describe('CalendarTable data (integration)', () => {
  it('generates rows for each day in a month', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate: new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    expect(rows).toHaveLength(31);
  });

  it('rows have the correct month', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate: new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    for (const row of rows) {
      expect(row.date.getUTCMonth()).toBe(6); // July = 6
    }
  });

  it('MW window start is within the dark window', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate: new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    for (const row of rows) {
      if (row.mwWindow) {
        expect(row.mwWindow.start.getTime()).toBeGreaterThanOrEqual(row.sun.twilightEnd.getTime() - 60_000);
        expect(row.mwWindow.end.getTime()).toBeLessThanOrEqual(row.sun.twilightStart.getTime() + 60_000);
      }
    }
  });
});

describe('CalendarTable data — Sydney and Tokyo integration', () => {
  it('Sydney July 2026: all rows have MW window within dark window', () => {
    const rows = generateCalendar({
      location: SYDNEY,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate:   new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    expect(rows).toHaveLength(31);
    for (const row of rows) {
      if (row.mwWindow) {
        expect(row.mwWindow.start.getTime()).toBeGreaterThanOrEqual(row.sun.twilightEnd.getTime() - 60_000);
        expect(row.mwWindow.end.getTime()).toBeLessThanOrEqual(row.sun.twilightStart.getTime() + 60_000);
      }
    }
  });

  it('Tokyo July 2026: all rows have valid rating and MW window within dark window', () => {
    const rows = generateCalendar({
      location: TOKYO,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate:   new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    expect(rows).toHaveLength(31);
    for (const row of rows) {
      expect(['best', 'partial', 'not-visible']).toContain(row.rating);
      if (row.mwWindow) {
        expect(row.mwWindow.start.getTime()).toBeGreaterThanOrEqual(row.sun.twilightEnd.getTime() - 60_000);
        expect(row.mwWindow.end.getTime()).toBeLessThanOrEqual(row.sun.twilightStart.getTime() + 60_000);
      }
    }
  });
});

// Fixture-driven tests from test/fixtures/midwest-2024-reference.json
describe('midwest-2024 reference fixtures (Denver ~39°N)', () => {
  it('Apr 6 2024 — GC just rising in dark hours: mwWindow is not null', () => {
    // fixture note: "Early April — GC just starting to rise in dark hours", moon 27%
    const entry = midwestRef.find(e => e.date === '2024-04-06')!;
    const rows = generateCalendar({
      location: DENVER,
      startDate: new Date(Date.UTC(2024, 3, 6)),
      endDate:   new Date(Date.UTC(2024, 3, 6)),
      interval: 1,
    });
    expect(rows).toHaveLength(1);
    expect(entry.gc_visible).toBe(true);
    expect(rows[0]!.mwWindow).not.toBeNull();
    // Moon 27% is near threshold, but it sets before the early-morning MW window
    // (moonFrac < 0.25), so moonOk passes and the night rates 'best'.
    expect(rows[0]!.rating).toBe('best');
  });

  it('Jun 22 2024 — summer solstice, short night, high moon (90%): gc visible but partial', () => {
    // fixture note: "Summer solstice — short night but GC high, moon interference"
    const entry = midwestRef.find(e => e.date === '2024-06-22')!;
    const rows = generateCalendar({
      location: DENVER,
      startDate: new Date(Date.UTC(2024, 5, 22)),
      endDate:   new Date(Date.UTC(2024, 5, 22)),
      interval: 1,
    });
    expect(rows).toHaveLength(1);
    expect(entry.gc_visible).toBe(true);
    expect(rows[0]!.mwWindow).not.toBeNull();
    // 90% moon → heavy interference → not best
    expect(rows[0]!.rating).not.toBe('best');
  });

  it('Aug 3 2024 — new moon (~1%) + peak GC: rated best', () => {
    // fixture: rating_expected = 'best'
    const entry = midwestRef.find(e => e.date === '2024-08-03')!;
    const rows = generateCalendar({
      location: DENVER,
      startDate: new Date(Date.UTC(2024, 7, 3)),
      endDate:   new Date(Date.UTC(2024, 7, 3)),
      interval: 1,
    });
    expect(rows).toHaveLength(1);
    expect(entry.rating_expected).toBe('best');
    expect(rows[0]!.rating).toBe('best');
  });

  it('Dec 15 2024 — winter, GC below horizon: rated not-visible', () => {
    // fixture: rating_expected = 'not-visible', gc_visible = false
    const entry = midwestRef.find(e => e.date === '2024-12-15')!;
    const rows = generateCalendar({
      location: DENVER,
      startDate: new Date(Date.UTC(2024, 11, 15)),
      endDate:   new Date(Date.UTC(2024, 11, 15)),
      interval: 1,
    });
    expect(rows).toHaveLength(1);
    expect(entry.gc_visible).toBe(false);
    expect(entry.rating_expected).toBe('not-visible');
    expect(rows[0]!.rating).toBe('not-visible');
    expect(rows[0]!.mwWindow).toBeNull();
  });
});
