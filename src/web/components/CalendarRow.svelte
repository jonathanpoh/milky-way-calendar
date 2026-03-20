<script lang="ts">
  import type { CalendarRow } from '../../core/types.js';
  import MoonPhaseIcon from './MoonPhaseIcon.svelte';
  import NightBar from './NightBar.svelte';

  interface Props { row: CalendarRow; timezone: string; barStartMin: number; barEndMin: number; }
  let { row, timezone, barStartMin, barEndMin }: Props = $props();

  let hovering = $state(false);

  function fmtDuration(h: number | undefined): string {
    if (!h || h <= 0) return '—';
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return mm > 0 ? `${hh}h${mm}m` : `${hh}h`;
  }

  const dateStr = $derived(new Intl.DateTimeFormat('en-GB', {
    month: 'short', day: '2-digit', timeZone: timezone,
  }).format(row.date));
</script>

<tr
  class={row.rating}
  onmouseenter={() => hovering = true}
  onmouseleave={() => hovering = false}
  onfocusin={() => hovering = true}
  onfocusout={() => hovering = false}
>
  <td class="date">{dateStr}</td>
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
  <td class="position">{row.gc.positionLabel || '—'}</td>
</tr>

<style>
  tr { border-bottom: 1px solid #313244; }
  tr:hover { background: #1e1e2e; }
  tr.best td { color: #a6e3a1; }
  tr.partial td { color: #f9e2af; }
  tr.not-visible td { color: #585b70; }
  td {
    padding: 0.25rem 0.5rem;
    white-space: nowrap;
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
    vertical-align: middle;
  }
  .date { font-weight: 600; min-width: 5rem; }
  .rating { text-align: center; }
  .bar-cell { width: 100%; padding: 0.15rem 0.5rem; }
  .moon-cell { vertical-align: middle; }
  .moon-inner { display: flex; align-items: center; gap: 0.3rem; }
  .num { text-align: right; min-width: 7rem; }
  .gc-clear { opacity: 0.6; font-size: 0.75rem; }
  .position { font-size: 0.75rem; min-width: 7rem; }
</style>
