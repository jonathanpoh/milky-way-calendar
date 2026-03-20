import { describe, it, expect } from 'vitest';
import { moonEmoji } from '../../src/cli/emoji.js';

// MoonPhase convention: 0/360=new moon, 180=full moon, 90=waxing quarter, 270=waning quarter

describe('moonEmoji', () => {
  it('returns new moon emoji at phase angle 0', () => {
    expect(moonEmoji(0)).toBe('🌑');
  });

  it('returns full moon emoji near 180°', () => {
    expect(moonEmoji(180)).toBe('🌕');
  });

  it('returns waxing crescent near 45°', () => {
    expect(moonEmoji(45)).toBe('🌒');
  });

  it('returns waxing gibbous near 135°', () => {
    expect(moonEmoji(135)).toBe('🌔');
  });

  it('returns waning gibbous near 225°', () => {
    expect(moonEmoji(225)).toBe('🌖');
  });

  it('handles angles > 360 gracefully', () => {
    expect(moonEmoji(360)).toBe('🌑');
    expect(moonEmoji(540)).toBe('🌕');
  });
});
