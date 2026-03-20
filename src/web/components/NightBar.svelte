<script lang="ts">
  import type { CalendarRow } from '../../core/types.js';

  interface Props {
    row: CalendarRow;
    timezone: string;
    hovering: boolean;
    barStartMin: number;
    barEndMin: number;
  }
  let { row, timezone, hovering, barStartMin, barEndMin }: Props = $props();

  const barRangeMin = $derived(barEndMin - barStartMin);

  // Returns minutes since local noon (0 = noon, 720 = midnight, 1440 = next noon).
  function localMinSinceNoon(date: Date): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
    }).formatToParts(date);
    const h = parseInt(parts.find(p => p.type === 'hour')!.value) % 24;
    const m = parseInt(parts.find(p => p.type === 'minute')!.value);
    const localMin = h * 60 + m;
    // PM (noon–midnight): 0–719 minutes since noon
    // AM (midnight–noon): 720–1439 minutes since noon
    return localMin >= 720 ? localMin - 720 : localMin + 720;
  }

  function pct(date: Date | null): number | null {
    if (!date) return null;
    const p = ((localMinSinceNoon(date) - barStartMin) / barRangeMin) * 100;
    return Math.max(0, Math.min(100, p));
  }

  function fmtTime(date: Date | null): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
    }).format(date);
  }

  // Key positions
  const sunsetPct        = $derived(pct(row.sun.sunset)        ?? 0);
  const sunrisePct       = $derived(pct(row.sun.sunrise)       ?? 100);
  const twilightEndPct   = $derived(pct(row.sun.twilightEnd)   ?? sunrisePct);
  const twilightStartPct = $derived(pct(row.sun.twilightStart) ?? sunsetPct);
  const mwStartPct       = $derived(row.mwWindow      ? pct(row.mwWindow.start)      : null);
  const mwEndPct         = $derived(row.mwWindow      ? pct(row.mwWindow.end)        : null);
  const gcStartPct       = $derived(row.gcClearWindow ? pct(row.gcClearWindow.start) : null);
  const gcEndPct         = $derived(row.gcClearWindow ? pct(row.gcClearWindow.end)   : null);

  // Moon — compute unclamped bar % for rise/set, then derive a list of
  // [left, right] spans covering times the moon is up within the bar [0,100].
  // The moon can produce two spans (e.g. waxing crescent: already up at noon,
  // sets in the evening, then rises again the next morning before next noon).
  function rawPct(date: Date | null): number | null {
    if (!date) return null;
    return ((localMinSinceNoon(date) - barStartMin) / barRangeMin) * 100;
  }

  const moonriseRaw = $derived(rawPct(row.moon.moonrise));
  const moonsetRaw  = $derived(rawPct(row.moon.moonset));

  interface MoonSpan { left: number; right: number; }

  const moonSpans = $derived((): MoonSpan[] => {
    if (row.moon.moonrise === null && row.moon.moonset === null) return [];
    const r = moonriseRaw;
    const s = moonsetRaw;
    const upAtStart = r === null || r <= 0;   // moon already up at bar start
    const upAtEnd   = s === null || s >= 100; // moon still up at bar end
    const spans: MoonSpan[] = [];
    if (upAtStart && upAtEnd) {
      // Moon up for entire bar
      spans.push({ left: 0, right: 100 });
    } else if (upAtStart) {
      // Moon up from bar start, sets at s
      const right = Math.min(100, Math.max(0, s!));
      if (right > 0) spans.push({ left: 0, right });
    } else if (upAtEnd) {
      // Moon rises at r, up to bar end
      const left = Math.max(0, Math.min(100, r!));
      if (left < 100) spans.push({ left, right: 100 });
    } else {
      // Both r and s are finite values
      if (r! < s!) {
        // Rises then sets within bar
        const left  = Math.max(0, r!);
        const right = Math.min(100, s!);
        if (left < right) spans.push({ left, right });
      } else {
        // r > s: moon was up at bar start (set at s), rose again at r before bar end
        const right = Math.max(0, Math.min(100, s!));
        if (right > 0) spans.push({ left: 0, right });
        const left = Math.max(0, Math.min(100, r!));
        if (left < 100) spans.push({ left, right: 100 });
      }
    }
    return spans.filter(sp => sp.left < sp.right);
  });

  const hasMoon = $derived(moonSpans().length > 0);
  const moonOpacity = $derived(0.3 + (row.moon.illumination / 100) * 0.55);

  // ── MW/GC segments split by moon presence ────────────────────────────────
  type Span = { s: number; e: number };
  function splitByMoon(start: number, end: number): { free: Span[]; lit: Span[] } {
    const spans = moonSpans();
    if (spans.length === 0) return { free: [{ s: start, e: end }], lit: [] };
    // Collect all boundaries within [start, end]
    const bounds = [start, end];
    for (const ms of spans) {
      if (ms.left  > start && ms.left  < end) bounds.push(ms.left);
      if (ms.right > start && ms.right < end) bounds.push(ms.right);
    }
    bounds.sort((a, b) => a - b);
    const free: Span[] = [], lit: Span[] = [];
    for (let i = 0; i < bounds.length - 1; i++) {
      const a = bounds[i], b = bounds[i + 1];
      if (a >= b) continue;
      const mid = (a + b) / 2;
      if (spans.some(ms => mid >= ms.left && mid <= ms.right)) lit.push({ s: a, e: b });
      else free.push({ s: a, e: b });
    }
    return { free, lit };
  }

  const mwSegs = $derived(
    mwStartPct !== null && mwEndPct !== null ? splitByMoon(mwStartPct, mwEndPct) : null
  );
  const gcSegs = $derived(
    gcStartPct !== null && gcEndPct !== null ? splitByMoon(gcStartPct, gcEndPct) : null
  );

  // ── Labels ────────────────────────────────────────────────────────────────
  interface RawLabel { x: number; text: string; cls: string; }
  interface Label extends RawLabel { level: 0 | 1; xform: string; labelX?: number; }

  const MIN_GAP = 7;

  // Horizontal alignment at edges to prevent overflow
  function edgeXform(x: number): string {
    if (x < 4)  return 'translateX(4px)';
    if (x > 96) return 'translateX(calc(-100% - 4px))';
    return 'translateX(-50%)';
  }

  function applyCollision(raw: RawLabel[], levels = 2): Label[] {
    raw.sort((a, b) => a.x - b.x);
    const lastX: number[] = Array(levels).fill(-100);
    return raw.map((r): Label => {
      for (let lvl = 0; lvl < levels; lvl++) {
        if (r.x - lastX[lvl] >= MIN_GAP) {
          lastX[lvl] = r.x;
          return { ...r, level: (lvl as 0 | 1), xform: edgeXform(r.x) };
        }
      }
      lastX[levels - 1] = r.x;
      return { ...r, level: ((levels - 1) as 0 | 1), xform: edgeXform(r.x) };
    });
  }

  // MW labels — rise label sits left of its tick (right-aligned), set label sits right (left-aligned).
  // Near the bar edges the label snaps to the edge while the tick stays at the correct position.
  const mwLabels = $derived((): Label[] => {
    const labels: Label[] = [];
    if (mwStartPct !== null) {
      const x = mwStartPct;
      const snap = x < 12;
      labels.push({
        x, text: 'Milky Way ' + fmtTime(row.mwWindow!.start), cls: 'mw', level: 0,
        xform: snap ? 'translateX(4px)' : 'translateX(calc(-100% - 3px))',
        labelX: snap ? 0 : undefined,
      });
    }
    if (mwEndPct !== null) {
      const x = mwEndPct;
      const snap = x > 88;
      labels.push({
        x, text: fmtTime(row.mwWindow!.end), cls: 'mw', level: 0,
        xform: snap ? 'translateX(calc(-100% - 4px))' : 'translateX(3px)',
        labelX: snap ? 100 : undefined,
      });
    }
    return labels;
  });

  // Sky labels — drawn inside the sky lane
  // Left-side events (sunset, night start) are right-aligned at their tick.
  // Right-side events (night end, sunrise) are left-aligned at their tick.
  function skyXform(x: number): string {
    if (x < 4)  return 'translateX(4px)';
    if (x > 96) return 'translateX(calc(-100% - 4px))';
    return x < 50 ? 'translateX(calc(-100% - 3px))' : 'translateX(3px)';
  }

  const skyLabels = $derived((): Label[] => {
    const raw: RawLabel[] = [];
    const add = (x: number | null, text: string, cls: string) => {
      if (x !== null && text) raw.push({ x, text, cls });
    };
    add(sunsetPct,        "Sunset " + fmtTime(row.sun.sunset),        'sun');
    add(twilightEndPct,   fmtTime(row.sun.twilightEnd),   'dark');
    add(twilightStartPct, fmtTime(row.sun.twilightStart), 'dark');
    add(sunrisePct,       fmtTime(row.sun.sunrise) + " Sunrise",       'sun');
    return applyCollision(raw, 1).map(lbl => ({ ...lbl, xform: skyXform(lbl.x) }));
  });

  // Moon labels — float below all lanes, only for events within the bar window.
  // Moonrise sits left of its tick (right-aligned), moonset sits right (left-aligned).
  // Near the bar edges the label snaps to the edge while the tick stays at the correct position.
  const moonLabels = $derived((): Label[] => {
    if (!hasMoon) return [];
    const labels: Label[] = [];
    if (moonriseRaw !== null && moonriseRaw > 0 && moonriseRaw < 100) {
      const x = moonriseRaw;
      const snap = x < 12;
      labels.push({
        x, text: 'Moonrise ' + fmtTime(row.moon.moonrise), cls: 'moon', level: 0,
        xform: snap ? 'translateX(4px)' : 'translateX(calc(-100% - 3px))',
        labelX: snap ? 0 : undefined,
      });
    }
    if (moonsetRaw !== null && moonsetRaw > 0 && moonsetRaw < 100) {
      const x = moonsetRaw;
      const snap = x > 88;
      labels.push({
        x, text: fmtTime(row.moon.moonset) + ' Moonset', cls: 'moon', level: 0,
        xform: snap ? 'translateX(calc(-100% - 4px))' : 'translateX(3px)',
        labelX: snap ? 100 : undefined,
      });
    }
    return labels;
  });

  const allTicks = $derived(() => [...mwLabels(), ...skyLabels(), ...moonLabels()]);
</script>

<div class="night-bar-wrap">

  <!-- MW labels: floating above, in the padding-top area -->
  <div class="float-labels mw-labels" class:visible={hovering} aria-hidden="true">
    {#each mwLabels() as lbl}
      <span class="lbl {lbl.cls}"
        style="left:{lbl.labelX ?? lbl.x}%; bottom:2px; transform:{lbl.xform};"
      >{lbl.text}</span>
    {/each}
  </div>

  <div class="lanes">

    <!-- Lane 1 (top, thin): MW / GC visibility -->
    <div class="lane mw-lane">
      <div class="seg day" style="left:0%;width:{sunsetPct}%"></div>
      <div class="seg" style="left:{sunsetPct}%;width:{sunrisePct-sunsetPct}%;background:#09090f"></div>
      <div class="seg day" style="left:{sunrisePct}%;width:{100-sunrisePct}%"></div>
      {#if mwSegs}
        {#each mwSegs.lit as sp}
          <div class="seg" style="left:{sp.s}%;width:{sp.e-sp.s}%;background:#1a5c35"></div>
        {/each}
        {#each mwSegs.free as sp}
          <div class="seg" style="left:{sp.s}%;width:{sp.e-sp.s}%;background:#1a7a45"></div>
        {/each}
      {/if}
      {#if gcSegs}
        {#each gcSegs.free as sp}
          <div class="seg" style="left:{sp.s}%;width:{sp.e-sp.s}%;background:#2db870"></div>
        {/each}
      {/if}
    </div>

    <!-- Lane 2 (middle, tall): Sky darkness — labels drawn inside -->
    <div class="lane sky-lane" class:labels-on={hovering}>
      <div class="seg day" style="left:0%;width:{sunsetPct}%"></div>
      <div class="seg" style="left:{sunsetPct}%;width:{twilightEndPct-sunsetPct}%;background:linear-gradient(to right,#2a2050,#0f0f22)"></div>
      <div class="seg" style="left:{twilightEndPct}%;width:{twilightStartPct-twilightEndPct}%;background:#09090f"></div>
      <div class="seg" style="left:{twilightStartPct}%;width:{sunrisePct-twilightStartPct}%;background:linear-gradient(to right,#0f0f22,#2a2050)"></div>
      <div class="seg day" style="left:{sunrisePct}%;width:{100-sunrisePct}%"></div>
      <!-- Sky labels rendered inside the bar -->
      {#each skyLabels() as lbl}
        <span class="lbl-inside {lbl.cls}"
          style="left:{lbl.x}%; transform:{lbl.xform} translateY(-50%);"
        >{lbl.text}</span>
      {/each}
      <!-- Night label: centered in the astronomical darkness window -->
      <span class="lbl-inside dark night-label"
        style="left:{(twilightEndPct + twilightStartPct) / 2}%; transform:translateX(-50%) translateY(-50%);"
      >Night</span>
    </div>

    <!-- Lane 3 (bottom, thin): Moon -->
    <div class="lane moon-lane">
      <div class="seg day" style="left:0%;width:{sunsetPct}%"></div>
      <div class="seg" style="left:{sunsetPct}%;width:{sunrisePct-sunsetPct}%;background:#09090f"></div>
      <div class="seg day" style="left:{sunrisePct}%;width:{100-sunrisePct}%"></div>
      {#each moonSpans() as ms}
        <div class="seg" style="left:{ms.left}%;width:{ms.right-ms.left}%;background:rgba(255,200,80,{moonOpacity})"></div>
      {/each}
    </div>

    <!-- Tick marks spanning all lanes -->
    <div class="ticks-overlay">
      {#each allTicks() as lbl}
        <div class="tick {lbl.cls}" style="left:{lbl.x}%"></div>
      {/each}
    </div>

  </div>

  <!-- Moon labels: floating below, in the padding-bottom area -->
  <div class="float-labels moon-labels" class:visible={hovering} aria-hidden="true">
    {#each moonLabels() as lbl}
      <span class="lbl {lbl.cls}"
        style="left:{lbl.labelX ?? lbl.x}%; top:2px; transform:{lbl.xform};"
      >{lbl.text}</span>
    {/each}
  </div>

</div>

<style>
  .night-bar-wrap {
    position: relative;
    padding-top: 18px;
    padding-bottom: 18px;
    width: 100%;
    min-width: 220px;
  }

  /* Floating label strips (MW above, moon below) */
  .float-labels {
    position: absolute;
    left: 0; right: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .mw-labels   { top: 2px;    height: 14px; }
  .moon-labels { bottom: 2px; height: 14px; }
  .float-labels.visible { opacity: 1; }

  /* Shared label style */
  .lbl {
    position: absolute;
    font-size: 0.61rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    line-height: 14px;
    font-weight: 500;
  }
  .lbl.sun  { color: #f2a65a; }
  .lbl.dark { color: #89b4fa; }
  .lbl.mw   { color: #a6e3a1; }
  .lbl.moon { color: #f9e2af; }

  /* Labels rendered inside the sky lane */
  .lbl-inside {
    position: absolute;
    top: 50%;
    font-size: 0.61rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    line-height: 14px;
    font-weight: 500;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .lbl-inside.sun  { color: #f2a65a; }
  .lbl-inside.dark { color: #89b4fa; }
  .sky-lane.labels-on .lbl-inside { opacity: 1; }

  /* Lanes */
  .lanes {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .lane {
    position: relative;
    overflow: visible; /* allow inside labels to breathe at edges */
    border-radius: 3px;
    background: #09090f;
    flex-shrink: 0;
  }
  /* Clip the segments but not the labels */
  .lane::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 3px;
    overflow: hidden;
  }
  .sky-lane  { height: 20px; overflow: hidden; } /* tallest: holds labels */
  .mw-lane   { height: 7px;  overflow: hidden; }
  .moon-lane { height: 7px;  overflow: hidden; }

  .seg {
    position: absolute;
    top: 0; bottom: 0;
  }
  .seg.day { background: #3b3560; }

  /* Tick overlay spans all lanes */
  .ticks-overlay {
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    pointer-events: none;
  }
  .tick {
    position: absolute;
    top: 0; bottom: 0;
    width: 1px;
    opacity: 0.45;
  }
  .tick.sun  { background: #f2a65a; }
  .tick.dark { background: #89b4fa; }
  .tick.mw   { background: #a6e3a1; }
  .tick.moon { background: #f9e2af; }
</style>
