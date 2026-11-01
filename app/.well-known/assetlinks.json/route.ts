import { assetLinksFor } from "@/lib/native/asset-links";

export const dynamic = "force-dynamic";

/**
 * Digital Asset Links for Android App Links (verified https deep links into
 * the Celestial Atlas app). Fingerprints are public certificate hashes, set
 * in `ANDROID_APP_SHA256_CERT_FINGERPRINTS` (comma-separated: the Play App
 * Signing key, plus the upload key for internal testing builds).
 */
export function GET() {
  return Response.json(
    assetLinksFor(
      process.env.GOOGLE_PLAY_PACKAGE_NAME,
      process.env.ANDROID_APP_SHA256_CERT_FINGERPRINTS,
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
