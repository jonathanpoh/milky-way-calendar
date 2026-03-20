# Milky Way Calendar

An interactive planning tool for landscape astrophotography sessions. Calculates Milky Way (galactic center) visibility, moon interference, and sky darkness for any location and date range — inspired by the [Capture the Atlas](https://capturetheatlas.com) PDF calendars.

Available as both a **web app** (Svelte, runs entirely in the browser) and a **CLI tool**.

## Features

- Galactic center rise/set/transit times and altitude
- Astronomical twilight windows (sun below −18°)
- Moon phase, illumination, rise/set times
- Night-by-night scoring: **best**, **partial**, or **not visible**
- Visual night bar showing the full noon-to-noon day with MW, sky darkness, and moon lanes
- Location search by city name (Google Places), GPS ("Use my location"), or manual lat/lon
- Cookie-based location persistence across visits
- GeoIP-based location estimate on first load

## Web App

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Google Maps API key (optional)

The web app works without an API key, but city search and GeoIP auto-location require one. Create a `.env` file:

```
GOOGLE_MAPS_API_KEY=your_key_here
```

Enable the following APIs for the key in Google Cloud Console:
- Places API (New)
- Geolocation API

## CLI

```bash
npm run cli -- --lat 38.18 --lon -7.59 --name "Alqueva, Portugal" --year 2026
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `--lat` | `38.563` | Latitude (decimal degrees) |
| `--lon` | `-8.882` | Longitude (decimal degrees) |
| `--name` | `Palmela, Portugal` | Location label |
| `--year` | current year | Year to generate |
| `--start` | Jan 1 | Start date (YYYY-MM-DD) |
| `--end` | Dec 31 | End date (YYYY-MM-DD) |
| `--interval` | `7` | Days between rows |
| `--timezone` | `Europe/Lisbon` | Display timezone (IANA) |

## Development

```bash
npm test          # run all tests
npm run test:watch
npm run build     # production web build
npm run preview   # preview production build
```

## Project Structure

```
src/
  core/           # celestial calculations (shared, browser + Node)
    calendar.ts   # orchestrator — generates CalendarRow[] for a date range
    galactic-center.ts
    moon.ts
    sun.ts
    milky-way.ts
    scoring.ts
  cli/            # terminal table renderer
  web/            # Svelte app
    components/
    stores/
```

All calculations run via [astronomy-engine](https://github.com/cosinekitty/astronomy) — no backend required.

## License

MIT — see [LICENSE](LICENSE).
