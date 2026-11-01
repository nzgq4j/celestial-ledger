import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Google Play `obfuscatedAccountId` for a Celestial Atlas user.
 *
 * A one-way SHA-256 of the Supabase user id with a fixed domain prefix,
 * base64url-encoded (43 characters; Play allows 64). It never contains the
 * email or any other personal data, and the server recomputes it to check
 * that a purchase token belongs to the signed-in account.
 */
export function obfuscatedAccountIdFor(userId: string): string {
  return createHash("sha256")
    .update(`celestial-atlas:google-play:v1:${userId}`)
    .digest("base64url");
}

/** Constant-time comparison of a purchase's account id with the user's. */
export function purchaseBelongsToUser(
  obfuscatedExternalAccountId: string | null | undefined,
  userId: string,
): boolean {
  if (!obfuscatedExternalAccountId) return false;
  const expected = Buffer.from(obfuscatedAccountIdFor(userId));
  const actual = Buffer.from(obfuscatedExternalAccountId);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
