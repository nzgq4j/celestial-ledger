import "server-only";
import {
  getGoogleAccessToken,
  parseServiceAccount,
  type ServiceAccount,
} from "@/lib/google-play/service-account";
import { MORNING_CHANNEL_ID } from "./messages";

/**
 * Firebase Cloud Messaging HTTP v1 sender. Credentials come from the
 * server-only env `FIREBASE_SERVICE_ACCOUNT_JSON` (raw or base64 JSON key of
 * a service account with the "Firebase Cloud Messaging API Admin" role).
 * `FIREBASE_PROJECT_ID` overrides the key's project_id.
 */
export const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

export type FcmMessage = {
  token: string;
  title: string;
  body: string;
  /** Same-origin path opened in the WebView when the notification is tapped. */
  url: string;
};

export type FcmResult =
  | { ok: true }
  | { ok: false; unregistered: boolean; retryable: boolean; code: string };

let account: ServiceAccount | null = null;
function firebaseAccount() {
  account ??= parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  return account;
}

export function fcmProjectId() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() || firebaseAccount().project_id;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID_MISSING");
  return projectId;
}

export function buildFcmPayload(message: FcmMessage) {
  return {
    message: {
      token: message.token,
      notification: { title: message.title, body: message.body },
      data: { url: message.url },
      android: {
        priority: "NORMAL",
        ttl: "21600s",
        notification: {
          channel_id: MORNING_CHANNEL_ID,
          icon: "ic_stat_notification",
          color: "#c9a75d",
          tag: "morning-reading",
        },
      },
    },
  };
}

/** Classifies an FCM v1 error response. */
export function classifyFcmError(
  status: number,
  body: unknown,
): Extract<FcmResult, { ok: false }> {
  const error = (body as { error?: { status?: string; details?: unknown[] } })
    ?.error;
  const errorCodes = (error?.details ?? [])
    .map((detail) => (detail as { errorCode?: string })?.errorCode)
    .filter((code): code is string => typeof code === "string");
  const code = errorCodes[0] ?? error?.status ?? `HTTP_${status}`;
  const unregistered = status === 404 || errorCodes.includes("UNREGISTERED");
  return {
    ok: false,
    unregistered,
    retryable: !unregistered && (status === 429 || status >= 500),
    code,
  };
}

export async function sendFcmMessage(
  message: FcmMessage,
  fetcher: typeof fetch = fetch,
): Promise<FcmResult> {
  const accessToken = await getGoogleAccessToken(
    firebaseAccount(),
    FCM_SCOPE,
    fetcher,
  );
  const response = await fetcher(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
      fcmProjectId(),
    )}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildFcmPayload(message)),
      cache: "no-store",
    },
  );
  if (response.ok) return { ok: true };
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON error bodies are classified by status alone.
  }
  return classifyFcmError(response.status, body);
}
