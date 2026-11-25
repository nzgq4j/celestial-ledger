import "server-only";

import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
  type ECDH,
} from "node:crypto";

/**
 * Web Push with only node:crypto:
 * - message encryption, RFC 8291 ("aes128gcm" content coding, RFC 8188);
 * - VAPID authentication, RFC 8292 (ES256 JWT).
 *
 * Keys come from server-only settings: WEB_PUSH_VAPID_PUBLIC_KEY (65-byte
 * uncompressed P-256 point, base64url), WEB_PUSH_VAPID_PRIVATE_KEY (32-byte
 * scalar, base64url) and WEB_PUSH_SUBJECT (mailto: or https: contact).
 */

export type WebPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type VapidKeys = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export type WebPushResult =
  { ok: true } | { ok: false; gone: boolean; retryable: boolean; code: string };

const b64u = (buf: Buffer) => buf.toString("base64url");
const fromB64u = (s: string) => Buffer.from(s, "base64url");
const hmac = (key: Buffer, data: Buffer) =>
  createHmac("sha256", key).update(data).digest();

/** RFC 8291 §3.4 + RFC 8188 §2: one record, no padding. */
export function encryptPayload(
  plaintext: Buffer,
  subscription: Pick<WebPushSubscription, "p256dh" | "auth">,
  options: { senderKeys?: ECDH; salt?: Buffer; recordSize?: number } = {},
): Buffer {
  const uaPublic = fromB64u(subscription.p256dh);
  const authSecret = fromB64u(subscription.auth);
  if (uaPublic.length !== 65 || uaPublic[0] !== 4)
    throw new Error("WEB_PUSH_BAD_P256DH");
  if (authSecret.length !== 16) throw new Error("WEB_PUSH_BAD_AUTH");

  const sender = options.senderKeys ?? createECDH("prime256v1");
  if (!options.senderKeys) sender.generateKeys();
  const asPublic = sender.getPublicKey();
  const salt = options.salt ?? randomBytes(16);
  const recordSize = options.recordSize ?? 4096;

  const ecdhSecret = sender.computeSecret(uaPublic);
  const prkKey = hmac(authSecret, ecdhSecret);
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0", "latin1"),
    uaPublic,
    asPublic,
  ]);
  const ikm = hmac(prkKey, Buffer.concat([keyInfo, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(
    prk,
    Buffer.from("Content-Encoding: aes128gcm\0\x01", "latin1"),
  ).subarray(0, 16);
  const nonce = hmac(
    prk,
    Buffer.from("Content-Encoding: nonce\0\x01", "latin1"),
  ).subarray(0, 12);

  if (plaintext.length + 17 > recordSize - 86)
    throw new Error("WEB_PUSH_PAYLOAD_TOO_LARGE");
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.concat([plaintext, Buffer.from([2])])),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(recordSize, 16);
  header.writeUInt8(asPublic.length, 20);
  return Buffer.concat([header, asPublic, ciphertext]);
}

/** RFC 8292 §2: ES256 JWT for the push service's origin. */
export function vapidAuthorization(
  endpoint: string,
  keys: VapidKeys,
  now: number = Math.floor(Date.now() / 1000),
): string {
  const publicKey = fromB64u(keys.publicKey);
  if (publicKey.length !== 65 || publicKey[0] !== 4)
    throw new Error("VAPID_BAD_PUBLIC_KEY");
  const privateKey = createPrivateKey({
    format: "jwk",
    key: {
      kty: "EC",
      crv: "P-256",
      d: keys.privateKey,
      x: b64u(publicKey.subarray(1, 33)),
      y: b64u(publicKey.subarray(33, 65)),
    },
  });
  const header = b64u(
    Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })),
  );
  const claims = b64u(
    Buffer.from(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: now + 12 * 3600,
        sub: keys.subject,
      }),
    ),
  );
  const signature = sign("sha256", Buffer.from(`${header}.${claims}`), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `vapid t=${header}.${claims}.${b64u(signature)}, k=${keys.publicKey}`;
}

export function vapidKeysFromEnv(): VapidKeys | null {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: { title: string; body: string; url: string },
  keys: VapidKeys,
  {
    ttlSeconds = 6 * 3600,
    fetcher = fetch,
  }: { ttlSeconds?: number; fetcher?: typeof fetch } = {},
): Promise<WebPushResult> {
  const body = encryptPayload(
    Buffer.from(JSON.stringify(payload)),
    subscription,
  );
  const response = await fetcher(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuthorization(subscription.endpoint, keys),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttlSeconds),
      Urgency: "normal",
    },
    body: new Uint8Array(body),
    cache: "no-store",
  });
  if (response.ok) return { ok: true };
  const gone = response.status === 404 || response.status === 410;
  return {
    ok: false,
    gone,
    retryable: !gone && (response.status === 429 || response.status >= 500),
    code: `HTTP_${response.status}`,
  };
}

/** Push services the app may register with (HTTPS only). */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/,
  /^[a-z0-9-]+\.notify\.windows\.com$/,
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return (
      url.protocol === "https:" &&
      PUSH_HOSTS.some((re) => re.test(url.hostname))
    );
  } catch {
    return false;
  }
}
