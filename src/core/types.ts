export interface Location {
  lat: number;
  lon: number;
  name?: string;
  timezone?: string;
}

export interface TimeWindow {
  start: Date;
  end: Date;
  durationHours: number;
}

export interface SunData {
  date: Date;
  sunset: Date;
  sunrise: Date;
  twilightEnd: Date;   // astronomical twilight end (evening, sun at -18°)
  twilightStart: Date; // astronomical twilight start (morning, sun at -18°)
  darkWindow: TimeWindow; // twilightEnd → twilightStart
}

export interface MoonData {
  date: Date;
  moonrise: Date | null;
  moonset: Date | null;
  illumination: number;   // 0–100 %
  phaseAngle: number;     // 0–360°
  moonriseNextDay: boolean;
  moonsetNextDay: boolean;
}

export interface GalacticCenterData {
  date: Date;
  rise: Date | null;
  set: Date | null;
  transit: Date | null;
  transitAltitude: number; // degrees
  positionLabel: string;   // e.g. "Arch (15°) - Vertical (65°)"
}

export type VisibilityRating = 'best' | 'partial' | 'not-visible';

export interface CalendarRow {
  date: Date;
  sun: SunData;
  moon: MoonData;
  gc: GalacticCenterData;
  mwWindow: TimeWindow | null;       // MW visibility window (dark ∩ GC above horizon)
  gcClearWindow: TimeWindow | null;  // subset where GC > 10°
  rating: VisibilityRating;
}

export interface CalendarOptions {
  location: Location;
  startDate: Date;
  endDate: Date;
  interval?: number; // days between rows, default 1
}
