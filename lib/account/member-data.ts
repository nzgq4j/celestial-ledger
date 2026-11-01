import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/supabase/config";
import { commerceFlags } from "@/lib/commerce/flags";
import { effectivePlanKeyForUser } from "@/lib/entitlements/server";
import {
  deriveAccountReportStates,
  primaryAccountReportAction,
  accountReportTypes,
} from "@/lib/account/report-states";
import {
  dailyAllowanceSchema,
  type DailyAllowance,
} from "@/lib/daily-readings/allowance";
import { isLocaleTag, type LocaleTag } from "@/lib/i18n/config";

/**
 * Server-side loaders shared by the member screens (/account and /reports).
 * Each loader reads only what its screen needs so the Today view does not pay
 * for the library, and so on. All reads run as the signed-in member through
 * row-level security, except the allowance RPC, prices and credits, which are
 * service-role reads scoped explicitly to the member's user id.
 */

export type MemberBirthProfile = {
  id: string;
  label: string;
  birth_date: string;
  display_name: string;
  time_unknown: boolean;
  time_zone: string;
  expires_at: string;
  created_at: string;
  natal_reading_generated_at: string | null;
};

export type MemberSubscription = {
  plan_key: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  grace_ends_at: string | null;
  provider: "stripe" | "google_play";
};

export async function loadMemberBase() {
  if (isDemoMode()) return null;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;
  const user = authData.user;
  const adminClient = createAdminClient();
  const commerce = commerceFlags();
  const [profileResult, birthProfileResult, adminRoleResult, planKey] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, created_at, report_locale")
        .single(),
      supabase
        .from("birth_profiles")
        .select(
          "id, label, birth_date, display_name, time_unknown, time_zone, expires_at, created_at, natal_reading_generated_at",
        )
        .order("created_at", { ascending: false }),
      adminClient
        .from("admin_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(),
      effectivePlanKeyForUser(user.id),
    ]);
  const subscription: MemberSubscription | null = commerce.subscriptions
    ? ((
        await adminClient
          .from("account_subscriptions")
          .select(
            "plan_key,status,current_period_end,cancel_at_period_end,grace_ends_at,provider",
          )
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data ?? null)
    : null;
  const profile = profileResult.data;
  const birthProfiles = (birthProfileResult.data ?? []) as MemberBirthProfile[];
  const now = new Date();
  const activeProfiles = birthProfiles.filter(
    (item) => new Date(item.expires_at) > now,
  );
  // The primary chart is the oldest active chart; this matches the
  // daily_reading_allowance RPC, which treats it as the member's own chart.
  const primaryProfile = [...activeProfiles].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  )[0];
  return {
    supabase,
    adminClient,
    user,
    commerce,
    profile,
    displayName:
      profile?.display_name?.trim() || user.email?.split("@")[0] || "",
    reportLocale: (profile?.report_locale && isLocaleTag(profile.report_locale)
      ? profile.report_locale
      : undefined) as LocaleTag | undefined,
    birthProfiles,
    activeProfiles,
    primaryProfile,
    adminRole: adminRoleResult.data?.role ?? null,
    planKey,
    subscription,
  };
}

export type MemberBase = NonNullable<
  Awaited<ReturnType<typeof loadMemberBase>>
>;

/** Reads the server-authoritative daily reading allowance for one chart. */
export async function dailyAllowanceFor(
  base: MemberBase,
  birthProfileId: string,
): Promise<DailyAllowance | undefined> {
  const { data, error } = await base.adminClient.rpc(
    "daily_reading_allowance",
    { p_user_id: base.user.id, p_birth_profile_id: birthProfileId },
  );
  if (error) return undefined;
  const parsed = dailyAllowanceSchema.safeParse(data);
  return parsed.success ? parsed.data : undefined;
}

export async function loadReportContext(base: MemberBase) {
  const { supabase, adminClient, commerce, planKey, user } = base;
  const [productResult, entitlementResult, reportResult] = await Promise.all([
    supabase
      .from("products")
      .select("report_type, name, description, unit_amount, currency")
      .order("unit_amount", { ascending: false }),
    supabase
      .from("entitlements")
      .select("id, report_type, status, granted_at")
      .order("granted_at", { ascending: false }),
    supabase
      .from("reports")
      .select(
        "id, entitlement_id, report_type, status, locale, attempts, next_attempt_at, expires_at, created_at",
      )
      .order("created_at", { ascending: false }),
  ]);
  const [{ data: reportPrices }, { data: reportCredits }] = commerce.checkout
    ? await Promise.all([
        adminClient
          .from("report_prices")
          .select("report_type,unit_amount,currency")
          .eq("plan_key", planKey)
          .eq("active", true)
          .order("catalog_version", { ascending: false }),
        adminClient
          .from("account_credits")
          .select("quantity_remaining,expires_at")
          .eq("user_id", user.id)
          .eq("credit_key", "report.standard")
          .gt("quantity_remaining", 0),
      ])
    : [{ data: [] }, { data: [] }];
  const products = productResult.data ?? [];
  const entitlements = entitlementResult.data ?? [];
  const reports = reportResult.data ?? [];
  const linkedEntitlementIds = new Set(
    reports.map((report) => report.entitlement_id),
  );
  const readyEntitlements = entitlements.filter(
    (item) =>
      (item.status === "unused" ||
        (item.status === "queued" && !linkedEntitlementIds.has(item.id))) &&
      (accountReportTypes as readonly string[]).includes(item.report_type),
  );
  const now = new Date();
  const availableReportCredits = (reportCredits ?? []).reduce(
    (total, credit) =>
      !credit.expires_at || new Date(credit.expires_at) > now
        ? total + credit.quantity_remaining
        : total,
    0,
  );
  const reportStates = deriveAccountReportStates({
    products,
    readyEntitlements,
    reports,
    planKey,
    includedReportCredits: availableReportCredits,
  });
  return {
    reports,
    readyEntitlements,
    reportStates,
    primaryReportType: primaryAccountReportAction(reportStates),
    reportPrices: reportPrices ?? [],
    availableReportCredits,
  };
}

export type ReportContext = Awaited<ReturnType<typeof loadReportContext>>;

/** Public report prices for visitors who are not signed in. */
export async function loadPublicReportPrices() {
  if (isDemoMode() || !commerceFlags().checkout) return [];
  const { data } = await createAdminClient()
    .from("report_prices")
    .select("report_type,unit_amount,currency")
    .eq("plan_key", "free")
    .eq("active", true)
    .order("catalog_version", { ascending: false });
  return data ?? [];
}

export function formatPrice(
  price: { unit_amount: number; currency: string } | undefined,
  locale: LocaleTag,
) {
  if (!price) return undefined;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency.toUpperCase(),
  }).format(price.unit_amount / 100);
}

export type LibraryItem = {
  id: string;
  kind: "report" | "daily" | "weekly" | "tarot";
  title: string;
  date: string;
  expiresAt: string | null;
  locale: string;
  status: string;
  href: string;
};

/** Saved readings (daily, weekly, tarot) that have not yet expired. */
export async function loadSavedReadings(
  base: MemberBase,
  options: { weeklyEnabled: boolean },
) {
  const nowIso = new Date().toISOString();
  const [dailyResult, weeklyResult, tarotResult] = await Promise.all([
    base.supabase
      .from("daily_readings")
      .select("id,birth_profile_id,reading_date,locale,generated_at,expires_at")
      .order("reading_date", { ascending: false })
      .gt("expires_at", nowIso),
    options.weeklyEnabled
      ? base.supabase
          .from("weekly_readings")
          .select(
            "id,week_start_date,week_end_date,reading_start_date,reading_end_date,locale,generated_at,status,expires_at",
          )
          .order("reading_start_date", { ascending: false })
          .gt("expires_at", nowIso)
      : Promise.resolve({ data: [], error: null }),
    base.supabase
      .from("tarot_readings")
      .select("id,title,locale,created_at,expires_at")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false }),
  ]);
  if (tarotResult.error)
    throw new Error(
      "Your saved tarot readings could not be loaded. Please try again.",
    );
  return {
    dailyReadings: dailyResult.data ?? [],
    weeklyReadings: weeklyResult.data ?? [],
    tarotReadings: tarotResult.data ?? [],
  };
}
