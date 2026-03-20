<script lang="ts">
  interface Props { phaseAngle: number; size?: number; illumination?: number; }
  let { phaseAngle, size = 24, illumination }: Props = $props();

  // phaseAngle: MoonPhase convention: 0/360=new moon, 180=full moon
  const normalized = $derived(((phaseAngle % 360) + 360) % 360);
  const isWaxing = $derived(normalized < 180);
  const fraction = $derived(isWaxing ? normalized / 180 : (360 - normalized) / 180);
  const r = $derived(size / 2);
  const rx = $derived(Math.abs(1 - 2 * fraction) * r);
  const isGibbous = $derived(fraction > 0.5);

  const path = $derived.by(() => {
    if (fraction < 0.02) return '';
    if (fraction > 0.98) {
      return `M 0,${r} A ${r},${r} 0 1,1 ${size},${r} A ${r},${r} 0 1,1 0,${r}`;
    }
    const arcDir = isGibbous ? (isWaxing ? 1 : 0) : (isWaxing ? 0 : 1);
    return [
      `M ${r},0`,
      `A ${r},${r} 0 0,${isWaxing ? 1 : 0} ${r},${size}`,
      `A ${rx},${r} 0 0,${arcDir} ${r},0`,
    ].join(' ');
  });

  const bgFill = '#1e1e2e';
  const moonFill = '#f9e2af';
</script>

<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={illumination != null ? `Moon phase: ${illumination}% illuminated` : 'Moon phase'}>
  <circle cx={r} cy={r} r={r} fill={bgFill} />
  {#if path}
    <path d={path} fill={moonFill} />
  {/if}
  <circle cx={r} cy={r} r={r - 0.5} fill="none" stroke="#585b70" stroke-width="1" />
</svg>
