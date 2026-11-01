"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reconcileUnacknowledgedPurchases } from "@/lib/native/billing-client";
import { documentNativeMessages } from "@/lib/native/messages";
import {
  APP_LINK_ORIGINS,
  inAppPath,
  isNativeAndroidApp,
  isSignedIn,
} from "@/lib/native/platform";
import {
  enableMorningAlerts,
  ensurePushListeners,
  pushPermission,
  readPushState,
  refreshRegistrationIfGranted,
  unregisterDevice,
  writePushState,
} from "@/lib/native/push-client";

/** Seconds on a daily reading before the morning-alert pre-prompt appears. */
const PROMPT_AFTER_READING_MS = 6_000;
const DAILY_READING_SELECTOR = ".daily-reading-view";
const LAUNCH_URL_KEY = "celestial-atlas:launch-url";

function appOrigins() {
  return [window.location.origin, ...APP_LINK_ORIGINS];
}

function navigateInApp(url: string) {
  const path = inAppPath(url, appOrigins());
  if (path && path !== `${location.pathname}${location.search}${location.hash}`)
    window.location.assign(path);
}

/**
 * Native glue for the Android app (Capacitor). Renders nothing and does
 * nothing on the web; every Capacitor module is loaded with dynamic import()
 * only after the native bridge is detected.
 *
 * - Android back button: history back, else minimise the app.
 * - External-origin links open in a Custom Tab (@capacitor/browser).
 * - App Links and notification taps navigate inside the WebView.
 * - Dark status bar; hides the splash screen once the page has loaded.
 * - Signed in: refreshes the FCM token, verifies unacknowledged Play
 *   purchases, and shows a friendly morning-alert pre-prompt once, after the
 *   first daily reading view (never at launch).
 * - Signed out: unregisters this device's token.
 */
export function NativeBridge() {
  const [native, setNative] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const promptTimer = useRef<number | null>(null);

  // Track `<html data-signed-in>`, which changes on sign-in/out navigations.
  useEffect(() => {
    if (!isNativeAndroidApp()) return;
    setNative(true);
    setSignedIn(isSignedIn());
    const observer = new MutationObserver(() => setSignedIn(isSignedIn()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-signed-in"],
    });
    return () => observer.disconnect();
  }, []);

  // Account-bound work whenever the signed-in state settles.
  useEffect(() => {
    if (!native) return;
    void (async () => {
      await ensurePushListeners(navigateInApp);
      if (signedIn) {
        void refreshRegistrationIfGranted();
        void reconcileUnacknowledgedPurchases();
      } else {
        void unregisterDevice();
      }
    })();
  }, [native, signedIn]);

  useEffect(() => {
    if (!isNativeAndroidApp()) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];

    void (async () => {
      const [{ App }, { SplashScreen }, { StatusBar, Style }] =
        await Promise.all([
          import("@capacitor/app"),
          import("@capacitor/splash-screen"),
          import("@capacitor/status-bar"),
        ]);
      if (disposed) return;

      void StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
      void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);

      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.minimizeApp();
      });
      const open = await App.addListener("appUrlOpen", ({ url }) =>
        navigateInApp(url),
      );
      cleanups.push(
        () => void back.remove(),
        () => void open.remove(),
      );
      if (disposed) {
        void back.remove();
        void open.remove();
        return;
      }

      // Cold start from an App Link: open it once per app process.
      const launch = await App.getLaunchUrl().catch(() => undefined);
      if (launch?.url) {
        let handled: string | null = null;
        try {
          handled = sessionStorage.getItem(LAUNCH_URL_KEY);
          sessionStorage.setItem(LAUNCH_URL_KEY, launch.url);
        } catch {
          // Without storage, still honour the link once on this page.
        }
        if (handled !== launch.url) navigateInApp(launch.url);
      }
    })();

    // External-origin links leave the WebView for a Custom Tab.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") return;
      if (appOrigins().includes(url.origin)) return;
      event.preventDefault();
      void import("@capacitor/browser").then(({ Browser }) =>
        Browser.open({ url: url.href, toolbarColor: "#07111f" }),
      );
    };
    document.addEventListener("click", onClick, true);
    cleanups.push(() => document.removeEventListener("click", onClick, true));

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  // Morning-alert pre-prompt after the first daily reading view.
  useEffect(() => {
    if (!native || !signedIn) return;
    if (readPushState().prompted) return;
    let cancelled = false;

    const schedule = () => {
      if (promptTimer.current !== null) return;
      if (!document.querySelector(DAILY_READING_SELECTOR)) return;
      writePushState({ readingViewed: true });
      promptTimer.current = window.setTimeout(async () => {
        promptTimer.current = null;
        if (cancelled || readPushState().prompted) return;
        if (!document.querySelector(DAILY_READING_SELECTOR)) return;
        if ((await pushPermission()) === "prompt") setShowPrompt(true);
        else writePushState({ prompted: true });
      }, PROMPT_AFTER_READING_MS);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer.disconnect();
      if (promptTimer.current !== null)
        window.clearTimeout(promptTimer.current);
      promptTimer.current = null;
    };
  }, [native, signedIn]);

  const dismiss = useCallback(() => {
    writePushState({ prompted: true });
    setShowPrompt(false);
  }, []);
  const accept = useCallback(async () => {
    setShowPrompt(false);
    await enableMorningAlerts();
  }, []);

  if (!showPrompt) return null;
  return <MorningAlertPrePrompt onAccept={accept} onDismiss={dismiss} />;
}

function MorningAlertPrePrompt({
  onAccept,
  onDismiss,
}: {
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const copy = documentNativeMessages().push;
  const allowRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    allowRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        alignItems: "end",
        background: "rgba(3, 7, 13, 0.6)",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="native-push-prompt-title"
        aria-describedby="native-push-prompt-body"
        style={{
          margin: "0 12px calc(12px + env(safe-area-inset-bottom))",
          padding: "24px 20px 20px",
          borderRadius: 20,
          border: "1px solid var(--atlas-gold-line, rgba(201,167,93,.35))",
          background: "var(--atlas-navy-raised, #0d1a2d)",
          color: "var(--atlas-ivory, #f2ead8)",
          boxShadow: "0 -8px 40px rgba(0,0,0,.45)",
        }}
      >
        <p
          aria-hidden="true"
          style={{
            margin: "0 0 8px",
            fontSize: 22,
            color: "var(--atlas-gold, #c9a75d)",
          }}
        >
          ☉︎
        </p>
        <h2
          id="native-push-prompt-title"
          style={{
            margin: "0 0 8px",
            fontFamily: "var(--font-display, Georgia, serif)",
            fontWeight: 500,
            fontSize: 24,
          }}
        >
          {copy.promptTitle}
        </h2>
        <p
          id="native-push-prompt-body"
          style={{ margin: "0 0 20px", lineHeight: 1.55, opacity: 0.85 }}
        >
          {copy.promptBody}
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <button
            ref={allowRef}
            type="button"
            className="atlas-button"
            onClick={onAccept}
            style={{ minHeight: 48 }}
          >
            {copy.allow}
          </button>
          <button
            type="button"
            className="atlas-button-ghost"
            onClick={onDismiss}
            style={{ minHeight: 48 }}
          >
            {copy.notNow}
          </button>
        </div>
      </div>
    </div>
  );
}
