"use client";

import { isNativePluginAvailable } from "./platform";

/**
 * Client side of the morning reading alert (Android app only). Capacitor
 * modules are imported lazily so the web bundle never loads them.
 */

const STORAGE_KEY = "celestial-atlas:push:v1";

type StoredPushState = {
  /** FCM token last registered with /api/devices. */
  token?: string;
  /** The pre-prompt was shown (accepted or not). */
  prompted?: boolean;
  /** A daily reading has been viewed at least once in the app. */
  readingViewed?: boolean;
};

export function readPushState(): StoredPushState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

export function writePushState(patch: Partial<StoredPushState>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readPushState(), ...patch }),
    );
  } catch {
    // Storage can be unavailable; the prompt may then show again later.
  }
}

export type PushPermission = "granted" | "denied" | "prompt" | "unsupported";

async function plugin() {
  if (!isNativePluginAvailable("PushNotifications")) return null;
  return (await import("@capacitor/push-notifications")).PushNotifications;
}

export async function pushPermission(): Promise<PushPermission> {
  const push = await plugin();
  if (!push) return "unsupported";
  const { receive } = await push.checkPermissions();
  return receive === "granted"
    ? "granted"
    : receive === "denied"
      ? "denied"
      : "prompt";
}

function deviceContext() {
  const lang = document.documentElement.lang;
  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }
  return {
    locale: ["en-GB", "es-ES", "fr-FR", "de-DE"].includes(lang)
      ? lang
      : undefined,
    timezone,
  };
}

async function postToken(
  token: string,
  preferences: { morningAlertEnabled?: boolean } = {},
) {
  const response = await fetch("/api/devices", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      platform: "android",
      ...deviceContext(),
      ...preferences,
    }),
  });
  if (!response.ok) throw new Error("DEVICE_REGISTRATION_FAILED");
  writePushState({ token });
}

let listenersReady: Promise<void> | null = null;
let pendingRegistration: {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
} | null = null;

/**
 * Registers the push listeners once per page: token refreshes are sent to
 * /api/devices, and notification taps call `onOpen` with the deep link.
 */
export function ensurePushListeners(onOpen: (url: string) => void) {
  listenersReady ??= (async () => {
    const push = await plugin();
    if (!push) return;
    await push.addListener("registration", ({ value }) => {
      const waiting = pendingRegistration;
      pendingRegistration = null;
      if (waiting) waiting.resolve(value);
      else if (value !== readPushState().token)
        void postToken(value).catch(() => undefined);
    });
    await push.addListener("registrationError", () => {
      pendingRegistration?.reject(new Error("PUSH_REGISTRATION_FAILED"));
      pendingRegistration = null;
    });
    await push.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification?.data as { url?: unknown } | undefined)
        ?.url;
      if (typeof url === "string") onOpen(url);
    });
  })();
  return listenersReady;
}

async function registerToken(): Promise<string> {
  const push = await plugin();
  if (!push) throw new Error("PUSH_UNSUPPORTED");
  const token = new Promise<string>((resolve, reject) => {
    pendingRegistration = { resolve, reject };
    setTimeout(() => {
      if (pendingRegistration?.resolve === resolve) {
        pendingRegistration = null;
        reject(new Error("PUSH_REGISTRATION_TIMEOUT"));
      }
    }, 15_000);
  });
  await push.register();
  return token;
}

/**
 * Asks for the Android 13+ notification permission (system dialog), then
 * registers the device with alerts on. Call after the friendly pre-prompt or
 * from the "Morning reading alert" setting.
 */
export async function enableMorningAlerts(): Promise<
  "enabled" | "denied" | "unsupported" | "failed"
> {
  const push = await plugin();
  if (!push) return "unsupported";
  writePushState({ prompted: true });
  let { receive } = await push.checkPermissions();
  if (receive === "prompt" || receive === "prompt-with-rationale")
    ({ receive } = await push.requestPermissions());
  if (receive !== "granted") return "denied";
  try {
    const token = await registerToken();
    await postToken(token, { morningAlertEnabled: true });
    return "enabled";
  } catch {
    return "failed";
  }
}

/** Refreshes the token silently on launch when permission is already granted. */
export async function refreshRegistrationIfGranted() {
  if ((await pushPermission()) !== "granted") return;
  try {
    const token = await registerToken();
    if (token !== readPushState().token) await postToken(token);
  } catch {
    // Retried on the next launch.
  }
}

/** Removes this device after sign-out so alerts stop for that account. */
export async function unregisterDevice() {
  const { token } = readPushState();
  if (!token) return;
  try {
    const response = await fetch("/api/devices", {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (response.ok) writePushState({ token: undefined });
  } catch {
    // Retried on the next signed-out page load.
  }
}

/** Turns the alert on/off or changes its time for this account's devices. */
export async function updateMorningAlert(preferences: {
  morningAlertEnabled?: boolean;
  morningAlertLocalTime?: string;
}) {
  const response = await fetch("/api/devices", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...preferences,
      timezone: deviceContext().timezone,
    }),
  });
  if (!response.ok) throw new Error("PREFERENCE_SAVE_FAILED");
  return (await response.json()) as {
    morningAlertEnabled: boolean;
    morningAlertLocalTime: string;
  };
}

export async function fetchMorningAlert() {
  const response = await fetch("/api/devices", { credentials: "same-origin" });
  if (!response.ok) throw new Error("PREFERENCE_LOAD_FAILED");
  return (await response.json()) as {
    registered: boolean;
    morningAlertEnabled: boolean;
    morningAlertLocalTime: string;
  };
}
