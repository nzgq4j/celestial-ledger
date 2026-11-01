import { appPlatformFromWindow } from "@/lib/app-shell/detect";

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  isPluginAvailable?: (name: string) => boolean;
};

/**
 * True only inside the Celestial Atlas Android app with the Capacitor bridge
 * injected. The user-agent token alone is not enough to call native plugins.
 */
export function isNativeAndroidApp(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal })
    .Capacitor;
  return (
    appPlatformFromWindow() === "android" &&
    !!capacitor?.isNativePlatform?.() &&
    capacitor.getPlatform?.() === "android"
  );
}

export function isNativePluginAvailable(name: string): boolean {
  if (!isNativeAndroidApp()) return false;
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal })
    .Capacitor;
  return capacitor?.isPluginAvailable?.(name) ?? true;
}

/** Production origins whose App Links open inside the app. */
export const APP_LINK_ORIGINS = [
  "https://www.celestialatlas.app",
  "https://celestialatlas.app",
];

/**
 * Path (with query and hash) for in-app navigation when `url` is relative or
 * belongs to one of `origins`; null for anything else.
 */
export function inAppPath(url: string, origins: string[]): string | null {
  try {
    if (
      url.startsWith("/") &&
      !url.startsWith("//") &&
      !url.startsWith("/\\")
    ) {
      const parsed = new URL(url, "https://app.invalid");
      if (parsed.origin !== "https://app.invalid") return null;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    const parsed = new URL(url);
    if (!origins.includes(parsed.origin)) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/** Whether the signed-in layout is rendered (`<html data-signed-in>`). */
export function isSignedIn(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-signed-in")
  );
}
