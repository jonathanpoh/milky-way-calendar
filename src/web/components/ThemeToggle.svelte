<script lang="ts">
  // Night-vision (red) mode preserves dark adaptation in the field.
  // 'night-vision' is applied as data-theme on <html>; default (unset) is dark.
  const KEY = 'mwcal_theme';

  let nightVision = $state(
    typeof document !== 'undefined' &&
    document.documentElement.dataset.theme === 'night-vision',
  );

  function toggle() {
    nightVision = !nightVision;
    if (nightVision) {
      document.documentElement.dataset.theme = 'night-vision';
      try { localStorage.setItem(KEY, 'night-vision'); } catch {}
    } else {
      delete document.documentElement.dataset.theme;
      try { localStorage.removeItem(KEY); } catch {}
    }
  }
</script>

<button
  class="toggle"
  class:on={nightVision}
  onclick={toggle}
  aria-pressed={nightVision}
  title={nightVision ? 'Night-vision mode on — switch to dark' : 'Switch to night-vision (red) mode'}
>
  <svg class="glyph" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <!-- crescent — fills as a disc when night-vision is on -->
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" fill="currentColor" />
  </svg>
  <span class="label">Night vision</span>
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.65rem;
    background: var(--surface);
    border: 1px solid var(--hairline);
    border-radius: 999px;
    color: var(--text-dim);
    font-family: var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 0.62rem;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .toggle:hover { color: var(--text); border-color: var(--text-faint); }
  .toggle.on {
    color: var(--starlight);
    border-color: var(--starlight);
    background: var(--surface-2);
  }
  .glyph { flex-shrink: 0; }
</style>
