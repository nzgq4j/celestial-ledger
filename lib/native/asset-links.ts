export const ANDROID_PACKAGE_NAME = "com.celestialatlas.app";

const FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

/** Normalises "aa:bb:…" / "AABB…" SHA-256 certificate fingerprints. */
export function normaliseFingerprint(value: string): string | null {
  const hex = value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  if (hex.length !== 64) return null;
  const formatted = hex.match(/.{2}/g)!.join(":");
  return FINGERPRINT.test(formatted) ? formatted : null;
}

/** Digital Asset Links statement list for /.well-known/assetlinks.json. */
export function assetLinksFor(
  packageName: string | undefined,
  fingerprints: string | undefined,
) {
  const certs = Array.from(
    new Set(
      (fingerprints ?? "")
        .split(",")
        .map((value) => normaliseFingerprint(value.trim()))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  if (!certs.length) return [];
  return [
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds",
      ],
      target: {
        namespace: "android_app",
        package_name: packageName?.trim() || ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: certs,
      },
    },
  ];
}
