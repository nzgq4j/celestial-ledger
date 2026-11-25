import { describe, expect, it } from 'vitest';
import { keyboardCovers } from './useKeyboardOpen';

describe('keyboardCovers', () => {
  it('detects a keyboard over a focused field', () => {
    expect(keyboardCovers(844, 480, 1, true)).toBe(true);
  });
  it('ignores pinch zoom, which shrinks the viewport in CSS pixels', () => {
    // Zoomed to 2x with no keyboard: 422 CSS px visible, but 844 at zoom level 1.
    expect(keyboardCovers(844, 422, 2, true)).toBe(false);
    expect(keyboardCovers(844, 422, 2, false)).toBe(false);
  });
  it('needs a focused text field', () => {
    expect(keyboardCovers(844, 480, 1, false)).toBe(false);
  });
});
