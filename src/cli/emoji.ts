/** Return a moon phase emoji based on the phase angle (0–360°). */
export function moonEmoji(phaseAngle: number): string {
  // phaseAngle from astronomy-engine: 0 = new moon, 180 = full moon
  const normalized = ((phaseAngle % 360) + 360) % 360;
  if (normalized < 22.5) return '🌑'; // new
  if (normalized < 67.5) return '🌒'; // waxing crescent
  if (normalized < 112.5) return '🌓'; // first quarter
  if (normalized < 157.5) return '🌔'; // waxing gibbous
  if (normalized < 202.5) return '🌕'; // full
  if (normalized < 247.5) return '🌖'; // waning gibbous
  if (normalized < 292.5) return '🌗'; // last quarter
  if (normalized < 337.5) return '🌘'; // waning crescent
  return '🌑'; // new
}
