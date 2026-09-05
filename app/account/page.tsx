import {
  isoDateInTimeZone,
  isoWeekStart,
} from "@/lib/weekly-readings/calculation";
import { AccountNavigation } from "@/components/AccountNavigation";
import { AccountLibrary, type SavedReading } from "@/components/AccountLibrary";
import { workspaceCopy } from "@/lib/account/workspace-copy";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/AccountSettings";
import { BirthProfileList } from "@/components/BirthProfileList";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import { DailyReadingGenerator } from "@/components/DailyReadingGenerator";
import { WeeklyReadingGenerator } from "@/components/WeeklyReadingGenerator";
import { AccountTarotDailyDraw } from "@/components/AccountTarotDailyDraw";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { isLocaleTag } from "@/lib/i18n/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  commerceFlags,
  tarotReadingFlags,
  weeklyReadingFlags,
} from "@/lib/commerce/flags";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { CheckoutButton } from "@/components/CheckoutButton";
import {
  capabilityDecisionForUser,
  effectivePlanKeyForUser,
} from "@/lib/entitlements/server";
import { WEEKLY_READING_CAPABILITY } from "@/lib/weekly-readings/domain";
import {
  deriveAccountReportStates,
  primaryAccountReportAction,
} from "@/lib/account/report-states";
import { listActiveTarotDecksForPlan } from "@/lib/tarot/decks";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const pack = await getServerTranslationPack();
  return {
    title: pack.messages.account.metadataTitle,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string;
    focusReport?: string;
    view?: string;
  }>;
}) {
  if (isDemoMode()) redirect("/auth/login");
  const pack = await getServerTranslationPack();
  const copy = pack.messages.account;
  const ui = workspaceCopy[pack.tag];
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) redirect("/auth/login");

  const adminClient = createAdminClient();
  const commerce = commerceFlags();
  const weeklyFlags = weeklyReadingFlags();
  const tarotFlags = tarotReadingFlags();
  const { data: adminRole } = await adminClient
    .from("admin_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  const [
    params,
    profileResult,
    birthProfileResult,
    reportResult,
    dailyReadingResult,
    productResult,
    entitlementResult,
  ] = await Promise.all([
    searchParams,
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
    supabase
      .from("reports")
      .select(
        "id, entitlement_id, report_type, status, locale, attempts, next_attempt_at, expires_at, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("daily_readings")
      .select("id,reading_date,locale,generated_at,expires_at")
      .order("reading_date", { ascending: false })
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("products")
      .select("report_type, name, description, unit_amount, currency")
      .order("unit_amount", { ascending: false }),
    supabase
      .from("entitlements")
      .select("id, report_type, status, granted_at")
      .order("granted_at", { ascending: false }),
  ]);

  const view = params.focusReport
    ? "library"
    : ["library", "create", "charts", "membership", "settings"].includes(
          params.view ?? "",
        )
      ? params.view!
      : "overview";
  const profile = profileResult.data;
  const birthProfiles = birthProfileResult.data ?? [];
  const reports = reportResult.data ?? [];
  const dailyReadings = dailyReadingResult.data ?? [];
  const weeklyReadings = weeklyFlags.generationEnabled
    ? ((
        await supabase
          .from("weekly_readings")
          .select(
            "id,week_start_date,week_end_date,reading_start_date,reading_end_date,locale,generated_at,status,expires_at",
          )
          .order("reading_start_date", { ascending: false })
          .gt("expires_at", new Date().toISOString())
      ).data ?? [])
    : [];
  const { data: tarotReadings, error: tarotLibraryError } = await supabase
    .from("tarot_readings")
    .select("id,title,locale,created_at,expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (tarotLibraryError)
    throw new Error(
      "Your saved tarot readings could not be loaded. Please try again.",
    );
  const products = productResult.data ?? [];
  const entitlements = entitlementResult.data ?? [];
  const reportLocale =
    profile?.report_locale && isLocaleTag(profile.report_locale)
      ? profile.report_locale
      : pack.tag;
  const linkedEntitlementIds = new Set(
    reports.map((report) => report.entitlement_id),
  );
  const readyEntitlements = entitlements.filter(
    (item) =>
      (item.status === "unused" ||
        (item.status === "queued" && !linkedEntitlementIds.has(item.id))) &&
      ["career_purpose", "recovery_reflection"].includes(item.report_type),
  );
  const displayName =
    profile?.display_name?.trim() ||
    authData.user.email?.split("@")[0] ||
    copy.explorer;
  const notices: Record<string, string> = {
    name_updated: copy.nameUpdated,
    password_updated: copy.passwordUpdated,
    invalid_name: copy.invalidName,
    name_failed: copy.nameFailed,
    invalid_password: copy.invalidPassword,
    current_password_failed: copy.currentPasswordFailed,
    password_failed: copy.passwordFailed,
    delete_confirmation_failed: copy.deleteConfirmationFailed,
    report_locale_updated: copy.reportLocaleUpdated,
    invalid_report_locale: copy.invalidReportLocale,
    report_locale_failed: copy.reportLocaleFailed,
  };
  const notice = params.notice ? notices[params.notice] : undefined;
  const subscription = commerce.subscriptions
    ? (
        await adminClient
          .from("account_subscriptions")
          .select(
            "plan_key,status,current_period_end,cancel_at_period_end,grace_ends_at",
          )
          .eq("user_id", authData.user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data
    : null;
  const weeklyDecision = weeklyFlags.generationEnabled
    ? await capabilityDecisionForUser(
        authData.user.id,
        WEEKLY_READING_CAPABILITY,
      )
    : null;
  const weeklyAccessible = weeklyDecision?.allowed === true;
  const activeProfiles = birthProfiles.filter(
    (profile) => new Date(profile.expires_at) > new Date(),
  );
  const primaryProfile = activeProfiles.at(-1);
  const chartDecision = await capabilityDecisionForUser(
    authData.user.id,
    "birth_profiles.saved",
  );
  const weekStart = isoWeekStart(
    new Date(
      `${isoDateInTimeZone(new Date(), primaryProfile?.time_zone ?? "UTC")}T12:00:00Z`,
    ),
  );
  const weekPeriodStart = `${weekStart}T00:00:00.000Z`;
  const weekReset = new Date(Date.parse(weekPeriodStart) + 7 * 86400000);
  const { data: weeklyUsage, error: weeklyUsageError } = await adminClient
    .from("capability_usage")
    .select("quantity")
    .eq("user_id", authData.user.id)
    .eq("capability_key", WEEKLY_READING_CAPABILITY)
    .eq("period_start", weekPeriodStart);
  const weeklyRemaining =
    !weeklyUsageError &&
    weeklyDecision?.allowed &&
    weeklyDecision.allowance !== null
      ? Math.max(
          0,
          weeklyDecision.allowance -
            (weeklyUsage ?? []).reduce((sum, row) => sum + row.quantity, 0),
        )
      : null;
  const commercePlanKey = await effectivePlanKeyForUser(authData.user.id);
  const tarotDecks = tarotFlags.enabled
    ? await listActiveTarotDecksForPlan(commercePlanKey, pack.tag)
    : [];
  const [{ data: reportPrices }, { data: reportCredits }] = commerce.checkout
    ? await Promise.all([
        adminClient
          .from("report_prices")
          .select("report_type,unit_amount,currency")
          .eq("plan_key", commercePlanKey)
          .eq("active", true)
          .order("catalog_version", { ascending: false }),
        adminClient
          .from("account_credits")
          .select("quantity_remaining,expires_at")
          .eq("user_id", authData.user.id)
          .eq("credit_key", "report.standard")
          .gt("quantity_remaining", 0),
      ])
    : [{ data: [] }, { data: [] }];
  const availableReportCredits = (reportCredits ?? []).reduce(
    (total, credit) =>
      !credit.expires_at || new Date(credit.expires_at) > new Date()
        ? total + credit.quantity_remaining
        : total,
    0,
  );
  const reportStates = deriveAccountReportStates({
    products,
    readyEntitlements,
    reports,
    planKey: commercePlanKey,
  });
  const primaryReportType = primaryAccountReportAction(reportStates);
  const reportProfiles = birthProfiles.map((item) => ({
    id: item.id,
    label: item.label,
  }));
  const planName = subscription
    ? `${subscription.plan_key[0].toUpperCase()}${subscription.plan_key.slice(1)}`
    : copy.freePlan;
  const planTiming = subscription?.current_period_end
    ? `${subscription.cancel_at_period_end ? copy.accessEnds : copy.nextBillingDate} ${new Date(subscription.current_period_end).toLocaleDateString(pack.tag)}.`
    : copy.freePlanCopy;
  const latestReport = reports.find(
    (report) =>
      report.status === "completed" &&
      (!report.expires_at || new Date(report.expires_at) > new Date()),
  );
  const nextStep = readyEntitlements.length
    ? {
        kicker: copy.waitingKicker,
        title: copy.waitingTitle,
        copy: copy.waitingCopy,
        href: "/account?view=create#reports",
        action: copy.waitingAction,
      }
    : !birthProfiles.length
      ? {
          kicker: copy.firstKicker,
          title: copy.firstTitle,
          copy: copy.firstCopy,
          href: "/#chart",
          action: copy.firstAction,
        }
      : latestReport
        ? {
            kicker: copy.continueKicker,
            title:
              latestReport.report_type === "recovery_reflection"
                ? copy.recoveryReflection
                : copy.careerPurpose,
            copy: copy.continueCopy,
            href: `/reports/${latestReport.id}`,
            action: copy.continueAction,
          }
        : {
            kicker: copy.anchoredKicker,
            title: copy.anchoredTitle,
            copy: copy.anchoredCopy,
            href: "/samples",
            action: copy.anchoredAction,
          };

  const savedReadings: SavedReading[] = [
    ...(tarotReadings ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      kind: "tarot" as const,
      date: item.created_at,
      expiresAt: item.expires_at,
      locale: item.locale,
      status: copy.statusCompleted,
      href: `/account/tarot/${item.id}`,
    })),
    ...dailyReadings.map((item) => ({
      id: item.id,
      title: ui.daily,
      kind: "daily" as const,
      date: item.generated_at,
      expiresAt: item.expires_at,
      locale: item.locale,
      status: copy.statusCompleted,
      href: `/daily-readings/${item.id}`,
    })),
    ...weeklyReadings.map((item) => ({
      id: item.id,
      title: ui.weekly,
      kind: "weekly" as const,
      date: item.generated_at,
      expiresAt: item.expires_at,
      locale: item.locale,
      status: item.status === "completed" ? copy.statusCompleted : item.status,
      href: `/weekly-readings/${item.id}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const recentWork = [
    ...savedReadings,
    ...reports
      .filter(
        (item) =>
          item.status === "completed" &&
          (!item.expires_at || new Date(item.expires_at) > new Date()),
      )
      .map((item) => ({
        title:
          item.report_type === "recovery_reflection"
            ? copy.recoveryReflection
            : copy.careerPurpose,
        date: item.created_at,
        href: `/reports/${item.id}`,
      })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <main className="page-shell private-library account-dashboard">
      <AccountNavigation
        view={view}
        copy={ui}
        admin={Boolean(adminRole)}
        adminLabel={copy.adminConsole}
      />

      <div className="account-workspace">
        <section className="account-command-bar" id="overview">
          <div className="account-command-bar__identity">
            <span aria-hidden="true">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p>{copy.heroKicker}</p>
              <h1>{displayName}</h1>
            </div>
          </div>
          <div className="account-command-bar__membership" id="billing">
            <span>{copy.currentMembership}</span>
            <strong>{planName}</strong>
            <small>{planTiming}</small>
            {adminRole?.role === "site_admin" && (
              <small>{ui.adminAccess}</small>
            )}
          </div>
          <div className="account-command-bar__manage">
            <span>{subscription?.status ?? copy.activeStatus}</span>
            {subscription ? (
              <BillingPortalButton />
            ) : (
              <Link className="button-secondary" href="/membership">
                {copy.viewMembership}
              </Link>
            )}
          </div>
        </section>

        {view === "overview" && (
          <>
            <section
              className="atlas-next-step"
              aria-labelledby="next-step-title"
            >
              <div>
                <p className="section-kicker">{nextStep.kicker}</p>
                <h2 id="next-step-title">{nextStep.title}</h2>
                <p>{nextStep.copy}</p>
              </div>
              <Link
                href={nextStep.href}
                className={
                  primaryReportType ? "button-secondary" : "button-primary"
                }
              >
                {nextStep.action}
              </Link>
            </section>

            <div className="account-stats" aria-label={copy.accountSummary}>
              <Link href="/account?view=charts">
                {birthProfiles.length} {ui.charts}
              </Link>
              <Link href="/account?view=library">
                {reports.length + savedReadings.length} {ui.saved}
              </Link>
              <Link href="/account?view=membership">
                {availableReportCredits} {ui.credits}
              </Link>
            </div>
          </>
        )}
        {(view === "overview" || view === "membership") && (
          <section
            className="dashboard-panel account-access"
            aria-labelledby="access-heading"
          >
            <h2 id="access-heading">{ui.access}</h2>
            <p>{ui.billingExplanation}</p>
            <dl className="access-list">
              <div>
                <dt>{ui.daily}</dt>
                <dd>{ui.accountIncluded}</dd>
              </div>
              <div>
                <dt>{ui.weekly}</dt>
                <dd>
                  {!weeklyFlags.generationEnabled
                    ? ui.unavailable
                    : weeklyAccessible
                      ? adminRole?.role === "site_admin"
                        ? ui.adminAccess
                        : weeklyDecision?.allowed &&
                            weeklyDecision.source !== "plan"
                          ? ui.grantAccess
                          : ui.planIncluded
                      : ui.notIncluded}
                </dd>
              </div>
              <div>
                <dt>Tarot</dt>
                <dd>
                  {tarotFlags.enabled
                    ? adminRole?.role === "site_admin"
                      ? ui.adminAccess
                      : ui.planIncluded
                    : ui.unavailable}
                </dd>
              </div>
              <div>
                <dt>{ui.charts}</dt>
                <dd>
                  {activeProfiles.length}
                  {chartDecision.allowed && chartDecision.allowance !== null
                    ? ` / ${chartDecision.allowance}`
                    : ""}
                </dd>
              </div>
              {weeklyRemaining !== null && (
                <div>
                  <dt>{ui.weeklyRemaining}</dt>
                  <dd>{weeklyRemaining}</dd>
                  <small>
                    {ui.resets}{" "}
                    {weekReset.toLocaleDateString(pack.tag, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </small>
                </div>
              )}
              <div>
                <dt>{ui.credits}</dt>
                <dd>{availableReportCredits}</dd>
              </div>
              <div>
                <dt>{ui.purchases}</dt>
                <dd>{readyEntitlements.length}</dd>
              </div>
            </dl>
            <Link href="/account?view=create" className="button-primary">
              {ui.create}
            </Link>
            <Link href="/membership" className="button-secondary">
              {ui.membership}
            </Link>
          </section>
        )}
        {view === "overview" && (
          <section className="dashboard-panel">
            <h2>{ui.recent}</h2>
            {recentWork.map((item) => (
              <div className="saved-reading-row" key={item.href}>
                <div>
                  <h3>{item.title}</h3>
                  <p>
                    {new Date(item.date).toLocaleDateString(pack.tag, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Link href={item.href} className="button-secondary">
                  {ui.open}
                </Link>
              </div>
            ))}
            {!recentWork.length && <p>{ui.empty}</p>}
            <Link href="/account?view=library">{ui.viewAll}</Link>
            <details className="workspace-guide">
              <summary>{ui.gettingStarted}</summary>
              <p>{ui.guide}</p>
              <Link href="/account?view=charts">{ui.charts}</Link>
            </details>
          </section>
        )}
        {view === "library" && (
          <AccountLibrary
            readings={savedReadings}
            reports={reports}
            copy={ui}
            locale={pack.tag}
            focusReportId={params.focusReport}
          />
        )}
        {notice && (
          <p className="account-notice" role="status">
            {notice}
          </p>
        )}

        {view === "create" && (
          <>
            <section
              className="dashboard-panel dashboard-panel--readings"
              id="readings"
            >
              <div className="dashboard-panel__heading">
                <div>
                  <p className="section-kicker">{copy.yourReadingsKicker}</p>
                  <h2>{ui.create}</h2>
                </div>
              </div>
              <div className="account-reading-cards">
                <details
                  className="account-reading-card account-reading-card--daily"
                  id="daily-reading"
                >
                  <summary className="account-reading-card__summary">
                    <div>
                      <p className="section-kicker">
                        {copy.dailyReadingKicker}
                      </p>
                      <h3>{copy.dailyReadingTitle}</h3>
                    </div>
                    <span className="account-reading-card__status">
                      <span className="dashboard-panel__meta">
                        {copy.registeredUserEntitlement}
                      </span>
                      <small>{ui.create}</small>
                    </span>
                  </summary>
                  <div className="account-reading-card__body">
                    <p className="dashboard-panel__introduction">
                      {copy.dailyReadingDescription}
                    </p>
                    <DailyReadingGenerator
                      profiles={reportProfiles}
                      existingReadings={dailyReadings}
                    />
                  </div>
                </details>

                <details
                  className="account-reading-card account-reading-card--weekly"
                  id="weekly-reading"
                >
                  <summary className="account-reading-card__summary">
                    <div>
                      <p className="section-kicker">
                        {copy.weeklyReadingKicker}
                      </p>
                      <h3>{copy.weeklyReadingTitle}</h3>
                    </div>
                    <span className="account-reading-card__status">
                      <span className="dashboard-panel__meta">
                        {!weeklyFlags.generationEnabled
                          ? copy.weeklyReadingUnavailableTitle
                          : weeklyAccessible
                            ? weeklyReadings.length
                              ? copy.weeklyReadingEntitled
                              : copy.weeklyReadingReady
                            : copy.weeklyReadingUpsellTitle}
                      </span>
                      <small>{ui.create}</small>
                    </span>
                  </summary>
                  <div className="account-reading-card__body">
                    {!weeklyFlags.generationEnabled ? (
                      <div className="dashboard-empty">
                        <h3>{copy.weeklyReadingUnavailableTitle}</h3>
                        <p>{copy.weeklyReadingUnavailableCopy}</p>
                      </div>
                    ) : weeklyAccessible ? (
                      <>
                        <p className="dashboard-panel__introduction">
                          {copy.weeklyReadingDescription}
                        </p>
                        <WeeklyReadingGenerator
                          primaryProfile={
                            primaryProfile
                              ? {
                                  id: primaryProfile.id,
                                  label: primaryProfile.label,
                                }
                              : undefined
                          }
                          existingReadings={weeklyReadings}
                        />
                      </>
                    ) : (
                      <div className="dashboard-empty dashboard-weekly-upsell">
                        <h3>{copy.weeklyReadingUpsellTitle}</h3>
                        <p>{copy.weeklyReadingUpsellCopy}</p>
                        <Link href="/membership" className="button-secondary">
                          {copy.weeklyReadingUpsellAction}
                        </Link>
                      </div>
                    )}
                  </div>
                </details>

                {tarotFlags.enabled && (
                  <details
                    className="account-reading-card account-reading-card--tarot"
                    id="tarot-daily-draw"
                  >
                    <summary className="account-reading-card__summary">
                      <div>
                        <p className="section-kicker">
                          {pack.messages.tarot.accountDailyKicker}
                        </p>
                        <h3>{pack.messages.tarot.accountDailyTitle}</h3>
                      </div>
                      <span className="account-reading-card__status">
                        <span className="dashboard-panel__meta">
                          {pack.messages.tarot.includedWithPlan}
                        </span>
                        <small>{ui.create}</small>
                      </span>
                    </summary>
                    <div className="account-reading-card__body">
                      <p className="dashboard-panel__introduction">
                        {pack.messages.tarot.accountDailyDescription}
                      </p>
                      <AccountTarotDailyDraw
                        decks={[...tarotDecks]}
                        currentPlan={commercePlanKey}
                        locale={pack.tag}
                        copy={pack.messages.tarot}
                      />
                    </div>
                  </details>
                )}
              </div>
            </section>

            <section
              className="dashboard-panel dashboard-panel--reports"
              id="reports"
            >
              <div className="dashboard-panel__heading">
                <div>
                  <p className="section-kicker">{copy.reportsCombinedKicker}</p>
                  <h2>{copy.reportsCombinedTitle}</h2>
                </div>
                <span className="dashboard-panel__meta">
                  {reports.length} {copy.saved}
                </span>
              </div>

              <div className="account-report-products">
                {reportStates.map((state) => {
                  const reportType = state.product.report_type;
                  const emphasis =
                    primaryReportType === reportType ? "primary" : "secondary";
                  const price = reportPrices?.find(
                    (candidate) => candidate.report_type === reportType,
                  );
                  const stateLabel =
                    state.kind === "purchased_unused"
                      ? copy.reportStatePurchased
                      : state.kind === "generated"
                        ? copy.reportStateGenerated
                        : state.kind === "premium_included"
                          ? copy.reportStateIncluded
                          : copy.reportStateAvailable;
                  return (
                    <article
                      className="account-report-product"
                      key={reportType}
                    >
                      <div>
                        <span>{stateLabel}</span>
                        <h3>
                          {reportType === "recovery_reflection"
                            ? copy.recoveryReflection
                            : copy.careerPurpose}
                        </h3>
                        <p>
                          {reportType === "recovery_reflection"
                            ? copy.recoveryDescription
                            : copy.careerDescription}
                        </p>
                        <small>{copy.reportDelivery}</small>
                      </div>
                      <div className="account-report-product__action">
                        {state.kind === "generated" ? (
                          <Link
                            className="button-quiet"
                            href={`/account?view=library&focusReport=${state.report.id}`}
                          >
                            {ui.library}
                          </Link>
                        ) : !birthProfiles.length ? (
                          <Link
                            href="/#chart"
                            className={
                              emphasis === "primary"
                                ? "button-primary"
                                : "button-secondary"
                            }
                          >
                            {copy.createNatalChart}
                          </Link>
                        ) : state.kind === "purchased_unused" ? (
                          <GenerateReportButton
                            entitlementId={state.entitlement.id}
                            reportType={reportType}
                            profiles={reportProfiles}
                            defaultLocale={reportLocale}
                            emphasis={emphasis}
                          />
                        ) : state.kind === "premium_included" ? (
                          <GenerateReportButton
                            reportType={reportType}
                            profiles={reportProfiles}
                            defaultLocale={reportLocale}
                            emphasis={emphasis}
                          />
                        ) : commerce.checkout ? (
                          price ? (
                            <CheckoutButton
                              reportType={reportType}
                              priceLabel={new Intl.NumberFormat(pack.tag, {
                                style: "currency",
                                currency: price.currency.toUpperCase(),
                              }).format(price.unit_amount / 100)}
                              creditAvailable={availableReportCredits > 0}
                              emphasis={emphasis}
                            />
                          ) : (
                            <strong>{copy.currentlyUnavailable}</strong>
                          )
                        ) : (
                          <div>
                            <strong>{copy.complimentary}</strong>
                            <GenerateReportButton
                              reportType={reportType}
                              profiles={reportProfiles}
                              defaultLocale={reportLocale}
                              emphasis={emphasis}
                            />
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
        {view === "charts" && (
          <section
            className="dashboard-panel dashboard-panel--charts"
            id="birth-profiles"
          >
            <div className="dashboard-panel__heading">
              <div>
                <p className="section-kicker">{copy.foundationKicker}</p>
                <h2>{copy.savedBirthCharts}</h2>
              </div>
              <Link href="/#chart" className="text-link">
                {copy.createAnotherChart}
              </Link>
            </div>
            <BirthProfileList initialProfiles={birthProfiles} />
          </section>
        )}
        {view === "settings" && (
          <AccountSettings
            displayName={profile?.display_name ?? ""}
            email={authData.user.email ?? ""}
            copy={copy}
            reportLocale={reportLocale}
          />
        )}
      </div>
    </main>
  );
}
