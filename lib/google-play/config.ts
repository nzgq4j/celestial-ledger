import "server-only";

export const DEFAULT_GOOGLE_PLAY_PACKAGE_NAME = "com.celestialatlas.app";
export const ANDROID_PUBLISHER_SCOPE =
  "https://www.googleapis.com/auth/androidpublisher";

export function googlePlayPackageName() {
  return (
    process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() ||
    DEFAULT_GOOGLE_PLAY_PACKAGE_NAME
  );
}
