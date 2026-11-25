// Generates a Web Push (VAPID) key pair for WEB_PUSH_VAPID_PUBLIC_KEY /
// WEB_PUSH_VAPID_PRIVATE_KEY. Keep the private key secret (Vercel, server only).
import { createECDH } from "node:crypto";

const keys = createECDH("prime256v1");
keys.generateKeys();
console.log(
  `WEB_PUSH_VAPID_PUBLIC_KEY=${keys.getPublicKey().toString("base64url")}`,
);
console.log(
  `WEB_PUSH_VAPID_PRIVATE_KEY=${keys.getPrivateKey().toString("base64url")}`,
);
