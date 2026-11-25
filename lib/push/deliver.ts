import "server-only";

import { PUSH_CHANNELS, sendFcmMessage } from "./fcm";
import { sendWebPush, vapidKeysFromEnv } from "./webpush";

export type PushDevice = {
  id: string;
  platform: "android" | "web";
  fcm_token: string | null;
  endpoint: string | null;
  p256dh: string | null;
  auth_secret: string | null;
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  kind: "insight" | "announcement";
};

/** `gone` means the push address no longer exists and the device should be removed. */
export type DeliveryResult = "sent" | "gone" | "retry" | "failed";

export async function deliver(
  device: PushDevice,
  payload: PushPayload,
  fetcher: typeof fetch = fetch,
): Promise<DeliveryResult> {
  try {
    if (device.platform === "android") {
      if (!device.fcm_token) return "gone";
      const r = await sendFcmMessage(
        {
          token: device.fcm_token,
          title: payload.title,
          body: payload.body,
          url: payload.url,
          channel: PUSH_CHANNELS[payload.kind],
        },
        fetcher,
      );
      return r.ok
        ? "sent"
        : r.unregistered
          ? "gone"
          : r.retryable
            ? "retry"
            : "failed";
    }
    const keys = vapidKeysFromEnv();
    if (!keys) return "retry";
    if (!device.endpoint || !device.p256dh || !device.auth_secret)
      return "gone";
    const r = await sendWebPush(
      {
        endpoint: device.endpoint,
        p256dh: device.p256dh,
        auth: device.auth_secret,
      },
      { title: payload.title, body: payload.body, url: payload.url },
      keys,
      { fetcher },
    );
    return r.ok ? "sent" : r.gone ? "gone" : r.retryable ? "retry" : "failed";
  } catch {
    // Missing credentials or a network error: try again on the next run.
    return "retry";
  }
}

/** Runs `task` over `items` with at most `limit` in flight. */
export async function pool<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await task(items[i]);
      }
    }),
  );
  return out;
}
