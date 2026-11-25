import {
  createDecipheriv,
  createECDH,
  createHmac,
  createPublicKey,
  verify,
} from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  encryptPayload,
  isAllowedPushEndpoint,
  vapidAuthorization,
} from "@/lib/push/webpush";

// RFC 8291, Appendix A (example encryption).
const RFC = {
  plaintext: "When I grow up, I want to be a watermelon",
  asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  asPublic:
    "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  uaPrivate: "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94",
  uaPublic:
    "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  salt: "DGv6ra1nlYgDCS1FRnbzlw",
  auth: "BTBZMqHH6r4Tts7J_aSIgg",
  body: "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
};

describe("Web Push encryption (RFC 8291)", () => {
  it("reproduces the RFC 8291 Appendix A example byte for byte", () => {
    const sender = createECDH("prime256v1");
    sender.setPrivateKey(Buffer.from(RFC.asPrivate, "base64url"));
    expect(sender.getPublicKey().toString("base64url")).toBe(RFC.asPublic);
    const out = encryptPayload(
      Buffer.from(RFC.plaintext),
      { p256dh: RFC.uaPublic, auth: RFC.auth },
      { senderKeys: sender, salt: Buffer.from(RFC.salt, "base64url") },
    );
    expect(out.toString("base64url")).toBe(RFC.body);
  });

  it("round-trips with fresh keys (the receiver can decrypt)", () => {
    const ua = createECDH("prime256v1");
    ua.generateKeys();
    const auth = Buffer.alloc(16, 7);
    const message = JSON.stringify({
      title: "Personal Day 3",
      body: "Socialize, create, share.",
      url: "/today",
    });
    const out = encryptPayload(Buffer.from(message), {
      p256dh: ua.getPublicKey().toString("base64url"),
      auth: auth.toString("base64url"),
    });
    // Receiver side of RFC 8291.
    const salt = out.subarray(0, 16),
      idlen = out[20],
      asPublic = out.subarray(21, 21 + idlen);
    const h = (k: Buffer, d: Buffer) =>
      createHmac("sha256", k).update(d).digest();
    const prkKey = h(auth, ua.computeSecret(asPublic));
    const ikm = h(
      prkKey,
      Buffer.concat([
        Buffer.from("WebPush: info\0", "latin1"),
        ua.getPublicKey(),
        asPublic,
        Buffer.from([1]),
      ]),
    );
    const prk = h(salt, ikm);
    const cek = h(
      prk,
      Buffer.from("Content-Encoding: aes128gcm\0\x01", "latin1"),
    ).subarray(0, 16);
    const nonce = h(
      prk,
      Buffer.from("Content-Encoding: nonce\0\x01", "latin1"),
    ).subarray(0, 12);
    const record = out.subarray(21 + idlen);
    const d = createDecipheriv("aes-128-gcm", cek, nonce);
    d.setAuthTag(record.subarray(record.length - 16));
    const plain = Buffer.concat([
      d.update(record.subarray(0, record.length - 16)),
      d.final(),
    ]);
    expect(plain.subarray(0, plain.length - 1).toString()).toBe(message);
    expect(plain[plain.length - 1]).toBe(2);
  });
});

describe("VAPID (RFC 8292)", () => {
  it("signs an ES256 JWT for the push service origin that verifies with the public key", () => {
    const keys = createECDH("prime256v1");
    keys.generateKeys();
    const publicKey = keys.getPublicKey().toString("base64url");
    const header = vapidAuthorization(
      "https://web.push.apple.com/QGuQyavXutnMWAN",
      {
        publicKey,
        privateKey: keys.getPrivateKey().toString("base64url"),
        subject: "mailto:support@example.test",
      },
      1_800_000_000,
    );
    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header)!;
    expect(match[4]).toBe(publicKey);
    const claims = JSON.parse(Buffer.from(match[2], "base64url").toString());
    expect(claims).toEqual({
      aud: "https://web.push.apple.com",
      exp: 1_800_000_000 + 43200,
      sub: "mailto:support@example.test",
    });
    const pub = keys.getPublicKey();
    const jwk = {
      kty: "EC",
      crv: "P-256",
      x: pub.subarray(1, 33).toString("base64url"),
      y: pub.subarray(33).toString("base64url"),
    };
    const ok = verify(
      "sha256",
      Buffer.from(`${match[1]}.${match[2]}`),
      {
        key: createPublicKey({ format: "jwk", key: jwk }),
        dsaEncoding: "ieee-p1363",
      },
      Buffer.from(match[3], "base64url"),
    );
    expect(ok).toBe(true);
  });
});

describe("push endpoints", () => {
  it("accepts the major push services over HTTPS only", () => {
    expect(
      isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"),
    ).toBe(true);
    expect(isAllowedPushEndpoint("https://web.push.apple.com/QGuQy")).toBe(
      true,
    );
    expect(
      isAllowedPushEndpoint(
        "https://updates.push.services.mozilla.com/wpush/v2/x",
      ),
    ).toBe(true);
    expect(
      isAllowedPushEndpoint(
        "https://wns2-par02p.notify.windows.com/w/?token=x",
      ),
    ).toBe(true);
    expect(
      isAllowedPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"),
    ).toBe(false);
    expect(isAllowedPushEndpoint("https://evil.example/fcm")).toBe(false);
    expect(isAllowedPushEndpoint("not a url")).toBe(false);
  });
});
