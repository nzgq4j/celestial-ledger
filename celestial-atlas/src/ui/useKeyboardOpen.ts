import { useEffect, useState } from 'react';

const TEXT_INPUT = /^(INPUT|TEXTAREA)$/;

/** True when a text field has focus (only then can an on-screen keyboard be open). */
function textFieldFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (!TEXT_INPUT.test(el.tagName)) return false;
  const type = (el as HTMLInputElement).type;
  return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file'].includes(type);
}

/**
 * Whether a keyboard covers the page: a text field has focus and the visible area,
 * measured at zoom level 1, is clearly shorter than the window.
 */
export function keyboardCovers(innerHeight: number, viewportHeight: number, scale: number, focused: boolean): boolean {
  return focused && innerHeight - viewportHeight * scale > 120;
}

/**
 * True while an on-screen keyboard covers part of the page. Mobile browsers shrink
 * the visual viewport when the keyboard opens. Pinch zoom shrinks it too, so the
 * height is compared at zoom level 1 and a text field must have focus.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = typeof window === 'undefined' ? undefined : window.visualViewport;
    if (!vv) return;
    const check = () => setOpen(keyboardCovers(window.innerHeight, vv.height, vv.scale, textFieldFocused()));
    vv.addEventListener('resize', check);
    document.addEventListener('focusin', check);
    document.addEventListener('focusout', check);
    check();
    return () => {
      vv.removeEventListener('resize', check);
      document.removeEventListener('focusin', check);
      document.removeEventListener('focusout', check);
    };
  }, []);
  return open;
}
