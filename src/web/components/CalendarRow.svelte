<script lang="ts">
  import type { CalendarRow } from '../../core/types.js';
  import MoonPhaseIcon from './MoonPhaseIcon.svelte';
  import NightBar from './NightBar.svelte';
  import GcArc from './GcArc.svelte';

  interface Props { row: CalendarRow; timezone: string; barStartMin: number; barEndMin: number; }
  let { row, timezone, barStartMin, barEndMin }: Props = $props();

  let hovering = $state(false);

  function fmtDuration(h: number | undefined): string {
    if (!h || h <= 0) return '—';
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return mm > 0 ? `${hh}h${mm}m` : `${hh}h`;
  }

  // Compact duration, e.g. "2h4m" / "45m" — matches the MW/GC clear column.
  function fmtWindowDur(h: number): string {
    const total = Math.round(h * 60);
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    if (hh === 0) return `${mm}m`;
    return mm > 0 ? `${hh}h${mm}m` : `${hh}h`;
  }

  function fmtTime(d: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
    }).format(d);
  }

  // Moon-free prime window, computed in the core (null on not-visible nights or
  // when the moon is up throughout — e.g. a bright moon rising mid-window).
  const shootWindow = $derived(row.shootingWindow);

  const dateStr = $derived(new Intl.DateTimeFormat('en-GB', {
    month: 'short', day: '2-digit', timeZone: timezone,
  }).format(row.date));
  const dayStr = $derived(new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', timeZone: timezone,
  }).format(row.date));

  const isToday = $derived.by(() => {
    const now = new Date();
    return row.date.getUTCFullYear() === now.getFullYear()
      && row.date.getUTCMonth() === now.getMonth()
      && row.date.getUTCDate() === now.getDate();
  });
</script>

<tr
  class={row.rating}
  class:today={isToday}
  onmouseenter={() => hovering = true}
  onmouseleave={() => hovering = false}
  onfocusin={() => hovering = true}
  onfocusout={() => hovering = false}
>
  <td class="date">
    <span class="date-main">{dateStr}</span>
    <span class="date-dow">{dayStr}</span>
  </td>
  <td class="rating">
    <span aria-label={row.rating === 'best' ? 'Best visibility' : row.rating === 'partial' ? 'Partial visibility' : 'Not visible'}>
      {row.rating === 'best' ? '★' : row.rating === 'partial' ? '◑' : '✗'}
    </span>
  </td>
  <td class="bar-cell">
    <NightBar {row} {timezone} {hovering} {barStartMin} {barEndMin} />
  </td>
  <td class="moon-cell">
    <div class="moon-inner">
      <MoonPhaseIcon phaseAngle={row.moon.phaseAngle} size={16} illumination={row.moon.illumination} />
      {row.moon.illumination}%
    </div>
  </td>
  <td class="num">
    <span title="MW window (GC above horizon)">{fmtDuration(row.mwWindow?.durationHours)}</span>
    {#if row.gcClearWindow}
      <span class="gc-clear" title="GC clear (altitude > 10°)"> / {fmtDuration(row.gcClearWindow.durationHours)}</span>
    {/if}
  </td>
  <td class="window">
    {#if shootWindow}
      {fmtTime(shootWindow.start)}–{fmtTime(shootWindow.end)}
      <span class="win-dur">({fmtWindowDur(shootWindow.durationHours)})</span>
    {:else}
      —
    {/if}
  </td>
  <td class="position">
    {#if row.gc.windowMaxAltitude != null}
      <span class="pos-inner">
        <GcArc altitude={row.gc.windowMaxAltitude} label={`Galactic core position: ${row.gc.positionLabel}`} />
        <span class="pos-label">{row.gc.positionLabel}</span>
      </span>
    {:else}
      —
    {/if}
  </td>
</tr>

<style>
  tr { border-bottom: 1px solid var(--hairline); transition: background 0.1s; }
  tr:hover { background: var(--surface); }
  tr.best td { color: var(--mw); }
  tr.partial td { color: var(--moon-lbl); }
  tr.not-visible td { color: var(--text-faint); }
  /* best nights get a starlight accent at the left edge */
  tr.best td.date { box-shadow: inset 3px 0 0 var(--mw); }
  /* today is highlighted regardless of rating */
  tr.today { background: var(--surface-2); }
  tr.today td.date { box-shadow: inset 3px 0 0 var(--azure); }
  tr.today td.date .date-main { color: var(--azure); }
  td {
    padding: 0.3rem 0.5rem;
    white-space: nowrap;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    vertical-align: middle;
  }
  .date { font-weight: 700; min-width: 5rem; vertical-align: middle; }
  .date-main { display: block; }
  .date-dow { display: block; font-size: 0.72rem; font-weight: 400; opacity: 0.6; }
  .rating { text-align: center; font-size: 0.95rem; }
  .bar-cell { width: 100%; padding: 0.2rem 0.5rem; }
  .moon-cell { vertical-align: middle; }
  .moon-inner { display: flex; align-items: center; gap: 0.3rem; }
  .num { text-align: right; min-width: 7rem; }
  .window { min-width: 9.5rem; }
  .win-dur { opacity: 0.6; font-size: 0.78rem; }
  .gc-clear { opacity: 0.6; font-size: 0.78rem; }
  .position { font-size: 0.78rem; min-width: 9rem; color: var(--text-dim); }
  /* arc + label both inherit the row's rating colour via currentColor */
  .pos-inner { display: inline-flex; align-items: center; gap: 0.4rem; }
  .pos-inner :global(.gc-arc) { flex-shrink: 0; }
</style>
