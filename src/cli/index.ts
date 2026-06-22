#!/usr/bin/env node
import { Command } from 'commander';
import tzlookup from 'tz-lookup';
import { generateCalendar } from '../core/calendar.js';
import { renderTable } from './table-renderer.js';
import { renderSummary } from './summary.js';

const program = new Command();

program
  .name('mwcal')
  .description('Milky Way astrophotography calendar')
  .option('--lat <number>', 'Latitude (decimal degrees)', '38.563')
  .option('--lon <number>', 'Longitude (decimal degrees)', '-8.882')
  .option('--name <string>', 'Location name', 'Palmela, Portugal')
  .option('--year <number>', 'Year', String(new Date().getFullYear()))
  .option('--start <date>', 'Start date (YYYY-MM-DD)')
  .option('--end <date>', 'End date (YYYY-MM-DD)')
  .option('--interval <days>', 'Days between rows', '7')
  .option('--timezone <tz>', 'Display timezone (IANA)')
  .parse(process.argv);

const opts = program.opts<{
  lat: string; lon: string; name: string;
  year: string; start?: string; end?: string;
  interval: string; timezone?: string;
}>();

const lat = parseFloat(opts.lat);
const lon = parseFloat(opts.lon);
const year = parseInt(opts.year, 10);
const interval = parseInt(opts.interval, 10);

if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
  console.error('Error: --lat must be a number between -90 and 90');
  process.exit(1);
}
if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
  console.error('Error: --lon must be a number between -180 and 180');
  process.exit(1);
}
if (!Number.isFinite(year)) {
  console.error('Error: --year must be a valid number');
  process.exit(1);
}
if (!Number.isFinite(interval) || interval < 1) {
  console.error('Error: --interval must be >= 1');
  process.exit(1);
}

let timezone: string;
if (opts.timezone) {
  timezone = opts.timezone;
} else {
  try {
    timezone = tzlookup(lat, lon);
  } catch {
    timezone = 'UTC';
  }
}

const startDate = opts.start ? new Date(opts.start) : new Date(Date.UTC(year, 0, 1));
const endDate = opts.end ? new Date(opts.end) : new Date(Date.UTC(year, 11, 31));

console.log(`\nMilky Way Calendar — ${opts.name} (${lat}°, ${lon}°)`);
console.log(`Timezone: ${timezone}`);
console.log(`Period: ${startDate.toISOString().slice(0, 10)} → ${endDate.toISOString().slice(0, 10)}, every ${interval} day(s)\n`);

const rows = generateCalendar({
  location: { lat, lon, name: opts.name, timezone },
  startDate,
  endDate,
  interval,
});

console.log(renderTable(rows, timezone));
console.log(renderSummary(rows, timezone));
