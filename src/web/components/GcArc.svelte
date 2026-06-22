<script lang="ts">
  // Renders the galactic core's path as an arc whose apex height maps to peak
  // altitude (0–90°): a shallow curve = a low "arch", a tall curve = "vertical".
  interface Props {
    altitude: number;          // peak altitude in degrees, 0–90
    width?: number;
    height?: number;
    pad?: number;
    stroke?: string;           // any CSS colour; defaults to inherit row colour
    coreColor?: string;        // apex dot colour; defaults to stroke
    strokeWidth?: number;
    showCore?: boolean;
    showHorizon?: boolean;
    label?: string;            // accessible label
  }
  let {
    altitude,
    width = 42,
    height = 18,
    pad = 2.5,
    stroke = 'currentColor',
    coreColor,
    strokeWidth = 1.5,
    showCore = true,
    showHorizon = true,
    label,
  }: Props = $props();

  const baseY = $derived(height - pad);
  const maxRise = $derived(baseY - pad);
  const alt = $derived(Math.max(0, Math.min(90, altitude)));
  const rise = $derived((alt / 90) * maxRise);
  const apexY = $derived(baseY - rise);
  const ctrlY = $derived(baseY - 2 * rise);
  const arcPath = $derived(`M ${pad},${baseY} Q ${width / 2},${ctrlY} ${width - pad},${baseY}`);
</script>

<svg
  viewBox="0 0 {width} {height}" {width} {height}
  class="gc-arc" role="img"
  aria-label={label ?? `Galactic core peaks at ${Math.round(alt)}°`}
>
  {#if showHorizon}
    <line x1={pad} y1={baseY} x2={width - pad} y2={baseY} class="horizon" />
  {/if}
  <path d={arcPath} class="track" style="stroke:{stroke};stroke-width:{strokeWidth}" />
  {#if showCore}
    <circle cx={width / 2} cy={apexY} r={Math.max(1.4, strokeWidth)} style="fill:{coreColor ?? stroke}" />
  {/if}
</svg>

<style>
  .gc-arc { display: block; overflow: visible; }
  .horizon { stroke: var(--hairline); stroke-width: 1; }
  .track { fill: none; stroke-linecap: round; }
</style>
