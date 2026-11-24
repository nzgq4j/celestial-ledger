import { describe, expect, it } from 'vitest';
import { DECKS } from '../screens/tarotDecks';
import { contrast, readable } from './color';

describe('contrast helpers', () => {
  it('computes WCAG ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#c9a35a', '#0a1128')).toBeGreaterThan(4.5);
  });

  it('keeps colours that already pass and adjusts ones that do not', () => {
    expect(readable('#c9a35a', '#0a1128')).toBe('#c9a35a');
    for (const d of DECKS) {
      expect(contrast(readable(d.accent, d.bg), d.bg), d.name).toBeGreaterThanOrEqual(4.5);
      expect(contrast(d.ink, d.bg), d.name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('meets 4.5:1 for the main palette text colours', () => {
    for (const c of ['#efe6d2', '#d9dce6', '#c4c9d8', '#aeb6cc', '#8d96b3', '#c9a35a', '#e3c27e', '#d98c7a']) {
      expect(contrast(c, '#0a1128'), c).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c, '#111c3d'), c).toBeGreaterThanOrEqual(4.5); // panel over the background
    }
  });
});
