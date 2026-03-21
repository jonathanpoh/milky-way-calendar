import { describe, it, expect } from 'vitest';
import { generateCalendar } from '../../src/core/calendar.js';
import { PALMELA, SYDNEY, TOKYO, DENVER } from '../fixtures/locations.js';

describe('generateCalendar', () => {
  it('returns correct number of rows for a given interval', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 0, 1)),
      endDate: new Date(Date.UTC(2026, 0, 31)),
      interval: 7,
    });
    // Jan 1, 8, 15, 22, 29 = 5 rows
    expect(rows).toHaveLength(5);
  });

  it('returns daily rows when interval=1', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 5, 1)),
      endDate: new Date(Date.UTC(2026, 5, 30)),
      interval: 1,
    });
    expect(rows).toHaveLength(30);
  });

  it('all rows have valid rating', () => {
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 3, 1)),
      endDate: new Date(Date.UTC(2026, 8, 30)),
      interval: 7,
    });
    for (const row of rows) {
      expect(['best', 'partial', 'not-visible']).toContain(row.rating);
    }
  });

  it('summer months have more visible nights than winter months', () => {
    const summerRows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 5, 1)),
      endDate: new Date(Date.UTC(2026, 7, 31)),
      interval: 1,
    });
    const winterRows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 11, 1)),
      endDate: new Date(Date.UTC(2026, 11, 31)),
      interval: 1,
    });
    const summerVisible = summerRows.filter(r => r.rating !== 'not-visible').length;
    const winterVisible = winterRows.filter(r => r.rating !== 'not-visible').length;
    expect(summerVisible).toBeGreaterThan(winterVisible);
  });

  it('full moon nights are not rated best (moon interference)', () => {
    // Jul 2 2026: 94% illuminated moon rises at start of dark window — must NOT be best
    const rows = generateCalendar({
      location: PALMELA,
      startDate: new Date(Date.UTC(2026, 6, 2)),
      endDate: new Date(Date.UTC(2026, 6, 2)),
      interval: 1,
    });
    expect(rows[0]!.rating).not.toBe('best');
  });

  it('Sydney: southern-hemisphere winter (Jul) has more visible nights than summer (Jan)', () => {
    const winter = generateCalendar({
      location: SYDNEY,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate:   new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    const summer = generateCalendar({
      location: SYDNEY,
      startDate: new Date(Date.UTC(2026, 0, 1)),
      endDate:   new Date(Date.UTC(2026, 0, 31)),
      interval: 1,
    });
    const winterVisible = winter.filter(r => r.rating !== 'not-visible').length;
    const summerVisible = summer.filter(r => r.rating !== 'not-visible').length;
    expect(winterVisible).toBeGreaterThan(summerVisible);
  });

  it('Tokyo: summer (Jul) has MW visible nights, winter (Jan) has very few', () => {
    const summer = generateCalendar({
      location: TOKYO,
      startDate: new Date(Date.UTC(2026, 6, 1)),
      endDate:   new Date(Date.UTC(2026, 6, 31)),
      interval: 1,
    });
    const winter = generateCalendar({
      location: TOKYO,
      startDate: new Date(Date.UTC(2026, 0, 1)),
      endDate:   new Date(Date.UTC(2026, 0, 31)),
      interval: 1,
    });
    const summerVisible = summer.filter(r => r.rating !== 'not-visible').length;
    const winterVisible = winter.filter(r => r.rating !== 'not-visible').length;
    expect(summerVisible).toBeGreaterThan(winterVisible);
  });

  it('new moon peak-season nights are rated best (Denver Aug 3 2024)', () => {
    const rows = generateCalendar({
      location: DENVER,
      startDate: new Date(Date.UTC(2024, 7, 3)),
      endDate: new Date(Date.UTC(2024, 7, 3)),
      interval: 1,
    });
    expect(rows[0]!.rating).toBe('best');
  });
});
