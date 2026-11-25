import { useEffect, useState } from 'react';

/**
 * True while an on-screen keyboard covers part of the page. Mobile browsers shrink
 * the visual viewport when the keyboard opens; the layout viewport stays the same.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = typeof window === 'undefined' ? undefined : window.visualViewport;
    if (!vv) return;
    const check = () => setOpen(window.innerHeight - vv.height > 120);
    vv.addEventListener('resize', check);
    check();
    return () => vv.removeEventListener('resize', check);
  }, []);
  return open;
}
