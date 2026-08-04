import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export type AdminSettings = {
  ai: { report: string; interpretation: string };
  recaptcha: { enabled: boolean; siteKey: string };
  analytics: { enabled: boolean; measurementId: string };
  search: { verificationToken: string };
  seo: {
    title: string;
    description: string;
    canonicalBase: string;
    indexingEnabled: boolean;
  };
  geo: { enabled: boolean; organizationDescription: string; sameAs: string[] };
};

export const defaultAdminSettings: AdminSettings = {
  ai: { report: "gpt-5-mini", interpretation: "gpt-5-mini" },
  recaptcha: { enabled: false, siteKey: "" },
  analytics: { enabled: false, measurementId: "" },
  search: { verificationToken: "" },
  seo: {
    title: "Celestial Atlas",
    description:
      "Personal astrology charts and evidence-linked private readings.",
    canonicalBase: "https://www.celestialatlas.app",
    indexingEnabled: true,
  },
  geo: {
    enabled: true,
    organizationDescription:
      "Celestial Atlas creates personal astrology charts and evidence-linked private readings.",
    sameAs: [],
  },
};

function object(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const { data } = await createAdminClient()
    .from("site_settings")
    .select("key,value");
  const map = new Map((data ?? []).map((row) => [row.key, object(row.value)]));
  const ai = map.get("ai.models") ?? {};
  const recaptcha = map.get("security.recaptcha") ?? {};
  const analytics = map.get("analytics.google") ?? {};
  const search = map.get("search.google") ?? {};
  const seo = map.get("seo.defaults") ?? {};
  const geo = map.get("geo.defaults") ?? {};
  return {
    ai: {
      report:
        typeof ai.report === "string"
          ? ai.report
          : defaultAdminSettings.ai.report,
      interpretation:
        typeof ai.interpretation === "string"
          ? ai.interpretation
          : defaultAdminSettings.ai.interpretation,
    },
    recaptcha: {
      enabled: recaptcha.enabled === true,
      siteKey: typeof recaptcha.siteKey === "string" ? recaptcha.siteKey : "",
    },
    analytics: {
      enabled: analytics.enabled === true,
      measurementId:
        typeof analytics.measurementId === "string"
          ? analytics.measurementId
          : "",
    },
    search: {
      verificationToken:
        typeof search.verificationToken === "string"
          ? search.verificationToken
          : "",
    },
    seo: {
      title:
        typeof seo.title === "string"
          ? seo.title
          : defaultAdminSettings.seo.title,
      description:
        typeof seo.description === "string"
          ? seo.description
          : defaultAdminSettings.seo.description,
      canonicalBase:
        typeof seo.canonicalBase === "string"
          ? seo.canonicalBase
          : defaultAdminSettings.seo.canonicalBase,
      indexingEnabled: seo.indexingEnabled !== false,
    },
    geo: {
      enabled: geo.enabled !== false,
      organizationDescription:
        typeof geo.organizationDescription === "string"
          ? geo.organizationDescription
          : defaultAdminSettings.geo.organizationDescription,
      sameAs: Array.isArray(geo.sameAs)
        ? geo.sameAs.filter((item): item is string => typeof item === "string")
        : [],
    },
  };
}

export async function getConfiguredModel(kind: "report" | "interpretation") {
  try {
    return (await getAdminSettings()).ai[kind];
  } catch {
    return kind === "report"
      ? process.env.OPENAI_REPORT_MODEL || "gpt-5-mini"
      : process.env.OPENAI_INTERPRETATION_MODEL || "gpt-5-mini";
  }
}
