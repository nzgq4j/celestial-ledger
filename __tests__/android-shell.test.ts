import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import config, {
  allowNavigation,
  PRODUCTION_ORIGIN,
  resolveServerUrl,
} from "@/capacitor.config";
import { NATIVE_APP_USER_AGENT_TOKEN } from "@/lib/app-shell/detect";
import { SITE_URL } from "@/lib/seo";
import { assetLinksFor, normaliseFingerprint } from "@/lib/native/asset-links";
import { inAppPath } from "@/lib/native/platform";

const read = (file: string) => readFileSync(path.resolve(file), "utf8");

describe("Capacitor configuration", () => {
  it("appends exactly the user-agent token the server detects", () => {
    expect(config.appendUserAgent).toBe(NATIVE_APP_USER_AGENT_TOKEN);
    expect(config.appendUserAgent).toBe("CelestialAtlasApp/Android");
  });

  it("loads the canonical site and keeps it in sync with lib/seo.ts", () => {
    expect(PRODUCTION_ORIGIN).toBe(SITE_URL);
    expect(resolveServerUrl(undefined)).toBe(SITE_URL);
    expect(config.server?.url).toBe(resolveServerUrl());
    expect(config.server?.androidScheme).toBe("https");
    expect(config.server?.cleartext).toBe(false);
  });

  it("allows an https staging override and rejects cleartext", () => {
    expect(resolveServerUrl("https://staging.example.com/path")).toBe(
      "https://staging.example.com",
    );
    expect(() => resolveServerUrl("http://staging.example.com")).toThrow();
  });

  it("keeps Stripe Checkout and Google OAuth out of the WebView", () => {
    expect(allowNavigation).toContain("*.supabase.co");
    expect(allowNavigation).toContain("www.celestialatlas.app");
    expect(allowNavigation).not.toContain("checkout.stripe.com");
    expect(allowNavigation).not.toContain("accounts.google.com");
  });

  it("identifies the app and uses the offline fallback", () => {
    expect(config.appId).toBe("com.celestialatlas.app");
    expect(config.appName).toBe("Celestial Atlas");
    expect(config.webDir).toBe("android-app/www");
    expect(config.backgroundColor).toBe("#07111f");
    const offline = read("android-app/www/index.html");
    expect(offline).toContain("Celestial Atlas needs a connection");
    expect(offline).toContain("#07111f");
    expect(offline).toContain("#c9a75d");
    const script = read("android-app/www/offline.js");
    for (const text of [
      "Celestial Atlas necesita conexión",
      "Celestial Atlas a besoin d’une connexion",
      "Celestial Atlas braucht eine Verbindung",
    ])
      expect(script).toContain(text);
  });
});

describe("Android project", () => {
  const manifest = read("android/app/src/main/AndroidManifest.xml");

  it("declares App Links, notifications, billing and no cleartext", () => {
    expect(manifest).toContain('android:autoVerify="true"');
    expect(manifest).toContain('android:host="www.celestialatlas.app"');
    for (const prefix of ["/account", "/tarot", "/horoscopes"])
      expect(manifest).toContain(`android:pathPrefix="${prefix}"`);
    expect(manifest).toContain("android.permission.POST_NOTIFICATIONS");
    expect(manifest).toContain("com.android.vending.BILLING");
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(manifest).toContain('android:allowBackup="false"');
  });

  it("keeps the morning channel id in sync with the push sender", async () => {
    const { MORNING_CHANNEL_ID } = await import("@/lib/push/messages");
    expect(
      read(
        "android/app/src/main/java/com/celestialatlas/app/MainActivity.java",
      ),
    ).toContain(`"${MORNING_CHANNEL_ID}"`);
    expect(manifest).toContain(`android:value="${MORNING_CHANNEL_ID}"`);
  });

  it("applies google-services only when the file exists and ignores secrets", () => {
    expect(read("android/app/build.gradle")).toContain(
      "apply plugin: 'com.google.gms.google-services'",
    );
    const ignore = read("android/.gitignore");
    for (const entry of [
      "google-services.json",
      "*.jks",
      "*.keystore",
      "keystore.properties",
    ])
      expect(ignore).toContain(entry);
  });

  it("commits no keystore or Firebase config", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === "build" || name === ".gradle" || name === "node_modules")
          continue;
        const file = path.join(dir, name);
        if (statSync(file).isDirectory()) walk(file);
        else if (/\.(jks|keystore|p12)$|^google-services\.json$/.test(name))
          offenders.push(file);
      }
    };
    if (existsSync("android")) walk("android");
    expect(offenders).toEqual([]);
  });

  it("ships an adaptive launcher icon on the navy background", () => {
    expect(
      read("android/app/src/main/res/values/ic_launcher_background.xml"),
    ).toContain("#07111F");
    const adaptive = read(
      "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
    );
    expect(adaptive).toContain("ic_launcher_foreground");
    expect(adaptive).toContain("ic_launcher_monochrome");
    for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
      expect(
        existsSync(
          `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
        ),
      ).toBe(true);
      expect(
        existsSync(
          `android/app/src/main/res/drawable-${density}/ic_stat_notification.png`,
        ),
      ).toBe(true);
    }
  });
});

describe("Digital Asset Links", () => {
  const fingerprint =
    "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5";

  it("normalises fingerprints and drops invalid ones", () => {
    expect(normaliseFingerprint(fingerprint.toLowerCase())).toBe(fingerprint);
    expect(normaliseFingerprint(fingerprint.replaceAll(":", ""))).toBe(
      fingerprint,
    );
    expect(normaliseFingerprint("not-a-fingerprint")).toBeNull();
  });

  it("emits one statement for the app package", () => {
    expect(assetLinksFor(undefined, "")).toEqual([]);
    const [statement] = assetLinksFor(undefined, `${fingerprint}, junk`);
    expect(statement.target).toEqual({
      namespace: "android_app",
      package_name: "com.celestialatlas.app",
      sha256_cert_fingerprints: [fingerprint],
    });
    expect(statement.relation).toContain(
      "delegate_permission/common.handle_all_urls",
    );
  });
});

describe("in-app deep links", () => {
  const origins = ["https://www.celestialatlas.app"];
  it("keeps same-site paths and rejects other origins", () => {
    expect(inAppPath("/account?view=charts", origins)).toBe(
      "/account?view=charts",
    );
    expect(inAppPath("https://www.celestialatlas.app/tarot#x", origins)).toBe(
      "/tarot#x",
    );
    expect(inAppPath("https://evil.example/account", origins)).toBeNull();
    expect(inAppPath("//evil.example/account", origins)).toBeNull();
    expect(inAppPath("javascript:alert(1)", origins)).toBeNull();
  });
});
