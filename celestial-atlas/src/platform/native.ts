// Native integrations. Every call is a no-op in a plain browser.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = (): boolean => Capacitor.isNativePlatform();

export async function setupSystemBars(): Promise<void> {
  if (!isNative()) return;
  try {
    // The app draws edge to edge; Capacitor's SystemBars passes the bar insets to CSS.
    // The glyph colour follows the theme (src/platform/theme.ts); light glyphs until it applies.
    await StatusBar.setStyle({ style: document.documentElement.classList.contains('theme-light') ? Style.Light : Style.Dark });
  } catch { /* older Android or not available */ }
}

export async function hideNativeSplash(): Promise<void> {
  if (!isNative()) return;
  try { await SplashScreen.hide({ fadeOutDuration: 200 }); } catch { /* already hidden */ }
}

export async function tap(): Promise<void> {
  if (!isNative()) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* no vibrator */ }
}

/** Android back button. The handler returns true when it handled the press. */
export function onBackButton(handler: () => boolean): () => void {
  if (!isNative()) return () => undefined;
  const sub = App.addListener('backButton', () => { if (!handler()) void App.exitApp(); });
  return () => { void sub.then(s => s.remove()); };
}

/** Called when the app returns to the foreground. */
export function onResume(handler: () => void): () => void {
  if (!isNative()) return () => undefined;
  const sub = App.addListener('resume', handler);
  return () => { void sub.then(s => s.remove()); };
}
