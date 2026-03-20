import A from './astronomy.js';
import type { Location } from './types.js';

export function makeObserver(location: Location): InstanceType<typeof A.Observer> {
  return new A.Observer(location.lat, location.lon, 0);
}

export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
