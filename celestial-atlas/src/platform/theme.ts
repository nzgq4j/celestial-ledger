// Appearance: dark (the default), light, or follow the device ("system").
// The choice is mirrored to localStorage so the right theme is applied before the
// first paint; Capacitor Preferences (KEYS.theme) remains the saved copy.
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative } from './native';

export type ThemePref = 'system' | 'light' | 'dark';
export const THEME_PREFS: readonly ThemePref[] = ['system', 'light', 'dark'];
export const DEFAULT_THEME: ThemePref = 'dark';

const LOCAL_KEY = 'atlas_theme';
/** Browser bar colours: the page background of each theme. */
const BAR_COLOR = { dark: '#0a1128', light: '#f4eee2' } as const;

export const isThemePref = (v: unknown): v is ThemePref => THEME_PREFS.includes(v as ThemePref);

export function readThemePref(): ThemePref {
  try {
    const v = window.localStorage.getItem(LOCAL_KEY);
    return isThemePref(v) ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function rememberThemePref(pref: ThemePref): void {
  try { window.localStorage.setItem(LOCAL_KEY, pref); } catch { /* storage unavailable */ }
}

const prefersLight = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: light)') : null;

export function resolveTheme(pref: ThemePref, systemLight = prefersLight()?.matches ?? false): 'light' | 'dark' {
  if (pref === 'system') return systemLight ? 'light' : 'dark';
  return pref;
}

function paint(mode: 'light' | 'dark'): void {
  const root = document.documentElement;
  root.classList.toggle('theme-light', mode === 'light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOR[mode]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', mode);
  if (isNative()) {
    // Capacitor's Style.Dark means light glyphs for a dark background, and Style.Light the reverse.
    void StatusBar.setStyle({ style: mode === 'light' ? Style.Light : Style.Dark }).catch(() => undefined);
  }
}

/** Applies the theme now and, for "system", follows device changes. Returns a cleanup function. */
export function applyTheme(pref: ThemePref): () => void {
  if (typeof document === 'undefined') return () => undefined;
  paint(resolveTheme(pref));
  const mq = pref === 'system' ? prefersLight() : null;
  if (!mq) return () => undefined;
  const onChange = () => paint(resolveTheme(pref, mq.matches));
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
