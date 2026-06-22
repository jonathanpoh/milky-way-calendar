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

// 'normal'      — sun rises and sets on this date.
// 'polar-day'   — midnight sun: sun never sets (no sunset/sunrise, no darkness).
// 'polar-night' — polar night: sun never rises (no sunset/sunrise), but a real
//                 twilight/dark cycle still brackets local midnight.
export type SunRegime = 'normal' | 'polar-day' | 'polar-night';

export interface SunData {
  date: Date;
  sunset: Date | null;        // null during polar day/night (no horizon crossing)
  sunrise: Date | null;       // null during polar day/night (no horizon crossing)
  regime: SunRegime;
  twilightEnd: Date | null;   // astronomical twilight end (evening, sun at -18°) — null during white nights
  twilightStart: Date | null; // astronomical twilight start (morning, sun at -18°) — null during white nights
  darkWindow: TimeWindow | null; // twilightEnd → twilightStart — null when sun never reaches -18°
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
  // GC altitude range sampled across the MW window — drives the arc visualisation.
  // null when there is no MW window that night.
  windowMinAltitude: number | null; // degrees
  windowMaxAltitude: number | null; // degrees
}

export type VisibilityRating = 'best' | 'partial' | 'not-visible';

export interface CalendarRow {
  date: Date;
  sun: SunData;
  moon: MoonData;
  gc: GalacticCenterData;
  mwWindow: TimeWindow | null;       // MW visibility window (dark ∩ GC above horizon)
  gcClearWindow: TimeWindow | null;  // subset where GC > 10°
  shootingWindow: TimeWindow | null; // moon-free portion of the prime window (the shootable time)
  rating: VisibilityRating;
}

export interface CalendarOptions {
  location: Location;
  startDate: Date;
  endDate: Date;
  interval?: number; // days between rows, default 1
}
