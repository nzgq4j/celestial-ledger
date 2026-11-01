import type { CapacitorConfig } from "@capacitor/cli";
// Relative import (no "@/" alias): the Capacitor CLI loads this file outside
// the Next.js/Vitest resolvers. detect.ts has no imports of its own.
import { NATIVE_APP_USER_AGENT_TOKEN } from "./lib/app-shell/detect";

/**
 * Celestial Atlas Android shell.
 *
 * The app loads the live site; web deploys reach the app without a store
 * release. `CAPACITOR_SERVER_URL` overrides the origin at `cap sync` time for
 * staging builds, e.g.
 *   CAPACITOR_SERVER_URL=https://staging.celestialatlas.app npm run android:sync
 * Keep `PRODUCTION_ORIGIN` in sync with `SITE_URL` in lib/seo.ts (tested).
 */
export const PRODUCTION_ORIGIN = "https://www.celestialatlas.app";

export function resolveServerUrl(
  override: string | undefined = process.env.CAPACITOR_SERVER_URL,
): string {
  const candidate = override?.trim() || PRODUCTION_ORIGIN;
  const url = new URL(candidate);
  if (url.protocol !== "https:")
    throw new Error("CAPACITOR_SERVER_URL must be an https:// origin.");
  return url.origin;
}

const serverUrl = resolveServerUrl();
const serverHost = new URL(serverUrl).hostname;

/**
 * Hosts the WebView may navigate to. Everything else (legal pages on other
 * domains, Google Play, Google's OAuth consent screen) leaves the WebView:
 * Capacitor hands it to the system browser. Google refuses OAuth inside
 * embedded WebViews (`disallowed_useragent`), so accounts.google.com is
 * deliberately NOT listed; the sign-in returns through the App Link
 * /auth/app-callback (see docs/android/README.md). checkout.stripe.com is not
 * listed because in-app purchases use Google Play Billing.
 */
export const allowNavigation = Array.from(
  new Set([
    serverHost,
    "celestialatlas.app",
    "www.celestialatlas.app",
    "*.supabase.co",
  ]),
);

const NAVY = "#07111f";

const config: CapacitorConfig = {
  appId: "com.celestialatlas.app",
  appName: "Celestial Atlas",
  // Offline fallback (also used as server.errorPath when the site is unreachable).
  webDir: "android-app/www",
  appendUserAgent: NATIVE_APP_USER_AGENT_TOKEN,
  backgroundColor: NAVY,
  loggingBehavior: "none",
  server: {
    url: serverUrl,
    androidScheme: "https",
    cleartext: false,
    allowNavigation,
    errorPath: "index.html",
  },
  android: {
    backgroundColor: NAVY,
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
    // Chromium 111+ (2023); older WebViews show the offline page instead.
    minWebViewVersion: 111,
  },
  plugins: {
    // Edge-to-edge (Android 15+ enforces it). The site sets
    // viewport-fit=cover and pads with env(safe-area-inset-*) in app mode.
    SystemBars: {
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
      style: "DARK",
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#00000000",
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: NAVY,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    PushNotifications: {
      presentationOptions: ["alert", "sound"],
    },
  },
};

export default config;
