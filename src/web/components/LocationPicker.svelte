<script lang="ts">
  import tzlookup from 'tz-lookup';
  import { location } from '../stores/calendar.js';
  import type { Location } from '../../core/types.js';
  import { validateCoords } from '../utils/coords.js';

  const MAPS_KEY = import.meta.env.GOOGLE_MAPS_API_KEY;
  const COOKIE_NAME = 'mwcal_location';

  // ── Cookie helpers ───────────────────────────────────────────────────────
  function saveCookie(loc: Location) {
    const value = encodeURIComponent(JSON.stringify({
      lat: loc.lat, lon: loc.lon, name: loc.name, timezone: loc.timezone,
    }));
    document.cookie = `${COOKIE_NAME}=${value}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
  }

  function loadCookie(): Location | null {
    const match = document.cookie.split('; ').find(r => r.startsWith(COOKIE_NAME + '='));
    if (!match) return null;
    try {
      return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
    } catch { return null; }
  }

  // ── Resolve timezone + display name ─────────────────────────────────────
  async function resolveLocation(lat: number, lon: number, knownName?: string): Promise<void> {
    loading = true;
    error = '';
    let timezone: string;
    try {
      timezone = tzlookup(lat, lon) ?? 'UTC';
    } catch {
      timezone = 'UTC';
    }
    let name = knownName ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    if (!knownName) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'milkyway-calendar/1.0' } },
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address ?? {};
          const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? '';
          const country = addr.country ?? '';
          name = [city, country].filter(Boolean).join(', ') || name;
        }
      } catch { /* keep coordinate fallback */ }
    }
    const loc: Location = { lat, lon, name, timezone };
    resolvedName = name;
    latInput = lat.toFixed(4);
    lonInput = lon.toFixed(4);
    loading = false;
    saveCookie(loc);
    location.set(loc);
  }

  // ── GeoIP on initial load ────────────────────────────────────────────────
  async function geoIPLoad() {
    if (!MAPS_KEY) return;
    try {
      const res = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${MAPS_KEY}`,
        { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } },
      );
      if (!res.ok) return;
      const data = await res.json();
      const lat: number = data.location?.lat;
      const lon: number = data.location?.lng;
      if (lat == null || lon == null) return;
      await resolveLocation(lat, lon);
    } catch { /* silent — keep default */ }
  }

  // ── Reactive UI state ────────────────────────────────────────────────────
  let latInput     = $state($location.lat.toFixed(4));
  let lonInput     = $state($location.lon.toFixed(4));
  let resolvedName = $state($location.name ?? '');

  // ── Initialise: cookie → GeoIP → default ────────────────────────────────
  const saved = loadCookie();
  if (saved) {
    location.set(saved);
    latInput     = saved.lat.toFixed(4);
    lonInput     = saved.lon.toFixed(4);
    resolvedName = saved.name ?? '';
  } else {
    geoIPLoad();
  }
  let searchQuery  = $state('');
  let suggestions  = $state<Suggestion[]>([]);
  let showDropdown = $state(false);
  let searchLoading = $state(false);
  let error        = $state('');
  let loading      = $state(false);

  let debounceTimer: ReturnType<typeof setTimeout>;
  let activeIndex = $state(-1);

  interface Suggestion {
    placePrediction: {
      place: string;
      text: { text: string };
      structuredFormat: {
        mainText: { text: string };
        secondaryText?: { text: string };
      };
    };
  }

  // ── Google Places autocomplete ───────────────────────────────────────────
  function onSearchInput() {
    clearTimeout(debounceTimer);
    suggestions = [];
    if (searchQuery.length < 2) { showDropdown = false; return; }
    debounceTimer = setTimeout(fetchSuggestions, 300);
  }

  async function fetchSuggestions() {
    if (!MAPS_KEY) return;
    searchLoading = true;
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': MAPS_KEY },
        body: JSON.stringify({
          input: searchQuery,
          includedPrimaryTypes: ['locality', 'administrative_area_level_3'],
          languageCode: 'en',
        }),
      });
      const data = await res.json();
      suggestions = data.suggestions ?? [];
      showDropdown = suggestions.length > 0;
      activeIndex = -1;
    } catch { suggestions = []; showDropdown = false; }
    searchLoading = false;
  }

  async function selectSuggestion(s: Suggestion) {
    showDropdown = false;
    searchQuery = s.placePrediction.text.text;
    loading = true;
    error = '';
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/${s.placePrediction.place}?fields=location,displayName`,
        { headers: { 'X-Goog-Api-Key': MAPS_KEY } },
      );
      const data = await res.json();
      const lat = data.location?.latitude;
      const lon = data.location?.longitude;
      if (lat == null || lon == null) throw new Error();
      await resolveLocation(lat, lon, s.placePrediction.text.text);
    } catch {
      error = 'Could not fetch location details';
      loading = false;
    }
  }

  function dismissDropdown() { showDropdown = false; activeIndex = -1; }

  function onSearchKeydown(e: KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') { dismissDropdown(); applyInputs(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex]);
      else dismissDropdown();
    } else if (e.key === 'Escape') {
      dismissDropdown();
    }
  }

  async function applyInputs() {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    const err = validateCoords(lat, lon);
    if (err) { error = err; return; }
    await resolveLocation(lat, lon);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) { error = 'Geolocation not supported by this browser'; return; }
    loading = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        searchQuery = '';
        await resolveLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => { loading = false; error = 'Could not get your location'; },
    );
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="location-picker" onmousedown={(e) => { if (!(e.target as Element).closest('.search-wrap')) dismissDropdown(); }}>
  <div class="inputs">
    <label>
      Latitude
      <input type="text" inputmode="decimal" bind:value={latInput} />
    </label>
    <label>
      Longitude
      <input type="text" inputmode="decimal" bind:value={lonInput} />
    </label>

    <div class="search-wrap">
      <label>
        Search city
        <div class="search-input-wrap">
          <input
            type="text"
            bind:value={searchQuery}
            oninput={onSearchInput}
            onkeydown={onSearchKeydown}
            placeholder="e.g. Tokyo"
            autocomplete="off"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls="search-listbox"
            aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          />
          {#if searchLoading}<span class="spin">⟳</span>{/if}
        </div>
      </label>
      {#if showDropdown}
        <ul class="dropdown" role="listbox" id="search-listbox">
          {#each suggestions as s, i}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <li
              id="suggestion-{i}"
              role="option"
              aria-selected={i === activeIndex}
              class:active={i === activeIndex}
              onmousedown={() => selectSuggestion(s)}
              onmouseenter={() => { activeIndex = i; }}
            >
              <span class="main">{s.placePrediction.structuredFormat.mainText.text}</span>
              {#if s.placePrediction.structuredFormat.secondaryText}
                <span class="secondary">{s.placePrediction.structuredFormat.secondaryText.text}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <button class="action-btn" onclick={useMyLocation} disabled={loading}>
      📍 Use my location
    </button>
    <button class="action-btn update-btn" onclick={applyInputs} disabled={loading}>
      {loading ? 'Loading…' : 'Update'}
    </button>
  </div>

  {#if resolvedName}
    <p class="resolved">{resolvedName}</p>
  {/if}
  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>

<style>
  .location-picker { margin-bottom: 1rem; }

  .inputs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.75rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.85rem;
    color: #a6adc8;
  }

  input[type="text"] {
    padding: 0.3rem 0.5rem;
    background: #1e1e2e;
    border: 1px solid #45475a;
    border-radius: 4px;
    color: #cdd6f4;
    font-size: 0.9rem;
  }
  label:nth-child(1) input,
  label:nth-child(2) input { width: 9rem; }
  .search-wrap input        { width: 14rem; }
  input:focus { outline: none; border-color: #89b4fa; }

  .search-wrap { position: relative; }
  .search-input-wrap { position: relative; display: flex; align-items: center; }
  .spin {
    position: absolute; right: 0.5rem;
    font-size: 0.9rem; color: #6c7086;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .dropdown {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    min-width: 100%;
    background: #1e1e2e;
    border: 1px solid #45475a;
    border-radius: 4px;
    margin: 0;
    padding: 0.25rem 0;
    list-style: none;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .dropdown li {
    padding: 0.4rem 0.7rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .dropdown li:hover, .dropdown li.active { background: #313244; }
  .main      { font-size: 0.9rem; color: #cdd6f4; }
  .secondary { font-size: 0.75rem; color: #6c7086; }

  .action-btn {
    padding: 0.35rem 0.8rem;
    border: 1px solid #45475a;
    border-radius: 4px;
    background: #1e1e2e;
    color: #cdd6f4;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
    align-self: flex-end;
  }
  .action-btn:hover:not(:disabled) { background: #313244; border-color: #6c7086; }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .update-btn { border-color: #89b4fa; color: #89b4fa; }

  .resolved { margin: 0.4rem 0 0; font-size: 0.82rem; color: #a6adc8; }
  .error    { margin: 0.4rem 0 0; font-size: 0.82rem; color: #f38ba8; }
</style>
