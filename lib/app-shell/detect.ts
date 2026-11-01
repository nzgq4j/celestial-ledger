/**
 * The Android app is a Capacitor shell that loads the live site. The shell
 * appends this token to the WebView user agent (`appendUserAgent` in
 * `capacitor.config.ts`) so the server can render the app layout on the very
 * first response, without a flash of the web header and footer.
 */
export const NATIVE_APP_USER_AGENT_TOKEN = "CelestialAtlasApp/Android";

export type AppPlatform = "android" | null;

export function appPlatformFromUserAgent(
  userAgent: string | null | undefined,
): AppPlatform {
  return userAgent?.includes(NATIVE_APP_USER_AGENT_TOKEN) ? "android" : null;
}

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

/** Client-side fallback for when the user agent token is unavailable. */
export function appPlatformFromWindow(): AppPlatform {
  if (typeof window === "undefined") return null;
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal })
    .Capacitor;
  if (
    capacitor?.isNativePlatform?.() &&
    capacitor.getPlatform?.() === "android"
  )
    return "android";
  return appPlatformFromUserAgent(window.navigator.userAgent);
}
