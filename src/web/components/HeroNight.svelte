<script lang="ts">
  import { calendarRows, location } from '../stores/calendar.js';
  import type { CalendarRow } from '../../core/types.js';
  import MoonPhaseIcon from './MoonPhaseIcon.svelte';
  import GcArc from './GcArc.svelte';

  const tz = $derived($location.timezone ?? 'UTC');

  function startOfToday(): number {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  // Next best upcoming night; fall back to next partial, then anything in range.
  const featured = $derived.by((): CalendarRow | null => {
    const rows = $calendarRows;
    const today = startOfToday();
    const upcoming = rows.filter(r => r.date.getTime() >= today);
    const pool = upcoming.length > 0 ? upcoming : rows;
    return pool.find(r => r.rating === 'best')
      ?? pool.find(r => r.rating === 'partial')
      ?? null;
  });

  // Headline window: the GC-clear (prime) window if present, else the MW window.
  const win = $derived(featured ? (featured.gcClearWindow ?? featured.mwWindow) : null);

  const eyebrow = $derived(featured?.rating === 'best' ? 'Next best night' : 'Next visible night');

  function fmtTime(d: Date | null): string {
    if (!d) return '';
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
    }).format(d);
  }
  function fmtDuration(h: number | undefined): string {
    if (!h || h <= 0) return '—';
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`;
  }
  const weekday = $derived(featured ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: tz }).format(featured.date) : '');
  const dayNum  = $derived(featured ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: tz }).format(featured.date) : '');
  const monthStr = $derived(featured ? new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: tz }).format(featured.date) : '');

  // Hero arc maps to the night's transit altitude (the core's peak that night).
  const alt = $derived(featured ? Math.max(0, Math.min(90, featured.gc.transitAltitude)) : 0);
  const arcStroke = $derived(featured?.rating === 'best' ? 'var(--gc-prime)' : 'var(--moon-lbl)');
</script>

{#if featured && win}
  <section class="hero" class:partial={featured.rating !== 'best'}>
    <div class="info">
      <p class="eyebrow">{eyebrow}</p>
      <div class="date">
        <span class="dow">{weekday}</span>
        <span class="dnum">{dayNum}</span>
        <span class="mon">{monthStr}</span>
      </div>
      <p class="place">{$location.name ?? 'your location'}</p>

      <div class="stats">
        <div class="stat">
          <span class="value">{fmtTime(win.start)}–{fmtTime(win.end)}</span>
          <span class="key">Shooting window</span>
        </div>
        <div class="stat">
          <span class="value">{fmtDuration(win.durationHours)}</span>
          <span class="key">{featured.gcClearWindow ? 'Core clear' : 'MW visible'}</span>
        </div>
        <div class="stat moon">
          <span class="value"><MoonPhaseIcon phaseAngle={featured.moon.phaseAngle} size={18} illumination={featured.moon.illumination} /> {featured.moon.illumination}%</span>
          <span class="key">Moon</span>
        </div>
      </div>
    </div>

    <div class="arc-panel">
      <GcArc
        altitude={alt}
        width={150} height={60} pad={5} strokeWidth={2}
        stroke={arcStroke} coreColor="var(--starlight)"
        label={`Galactic core transits at ${Math.round(alt)} degrees`}
      />
      <span class="alt">{Math.round(alt)}° <span class="alt-key">transit</span></span>
    </div>
  </section>
{:else}
  <section class="hero empty">
    <div class="info">
      <p class="eyebrow">No core nights</p>
      <p class="empty-msg">The galactic core isn't visible during darkness here for the rest of this year. Try next year, or a location closer to the equator.</p>
    </div>
  </section>
{/if}

<style>
  .hero {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: var(--sp-5);
    background: linear-gradient(135deg, var(--surface-2), var(--surface));
    border: 1px solid var(--hairline);
    border-radius: 12px;
    padding: var(--sp-5);
    margin-bottom: var(--sp-5);
    position: relative;
    overflow: hidden;
  }
  /* a thin accent edge keyed to the rating */
  .hero::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--gc-prime);
  }
  .hero.partial::before { background: var(--moon-lbl); }

  .eyebrow {
    margin: 0 0 var(--sp-2);
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--starlight);
  }

  .date {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    font-family: var(--font-display);
    line-height: 0.9;
    color: var(--text);
  }
  .date .dow  { font-size: 1.6rem; font-weight: 400; color: var(--text-dim); }
  .date .dnum { font-size: 3.4rem; font-weight: 700; }
  .date .mon  { font-size: 1.8rem; font-weight: 700; }

  .place {
    margin: var(--sp-2) 0 var(--sp-4);
    font-size: 0.85rem;
    color: var(--text-dim);
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-5);
  }
  .stat { display: flex; flex-direction: column; gap: 0.15rem; }
  .stat .value {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .stat .key {
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.6rem;
    color: var(--text-faint);
  }

  .arc-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    flex-shrink: 0;
  }
  .alt {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .alt-key {
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.58rem;
    color: var(--text-faint);
  }

  .empty-msg { margin: 0; max-width: 40ch; color: var(--text-dim); font-size: 0.9rem; line-height: 1.6; }

  @media (max-width: 640px) {
    .hero { flex-direction: column; }
    .arc-panel { flex-direction: row; align-self: flex-start; gap: var(--sp-4); }
    .date .dnum { font-size: 2.8rem; }
  }
</style>
