import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/AccountSettings";
import { BirthProfileList } from "@/components/BirthProfileList";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import { AccountReportList } from "@/components/AccountReportList";
import { DailyReadingGenerator } from "@/components/DailyReadingGenerator";
import { WeeklyReadingGenerator } from "@/components/WeeklyReadingGenerator";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { isLocaleTag } from "@/lib/i18n/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { commerceFlags, weeklyReadingFlags } from "@/lib/commerce/flags";
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
  searchParams: Promise<{ notice?: string; focusReport?: string }>;
}) {
  if (isDemoMode()) redirect("/auth/login");
  const pack = await getServerTranslationPack();
  const copy = pack.messages.account;
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) redirect("/auth/login");

  const adminClient = createAdminClient();
  const commerce = commerceFlags();
  const weeklyFlags = weeklyReadingFlags();
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
        "id, label, birth_date, display_name, time_unknown, expires_at, created_at, natal_reading_generated_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select(
        "id, entitlement_id, report_type, status, locale, expires_at, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("daily_readings")
      .select("id,reading_date,locale,generated_at")
      .order("reading_date", { ascending: false })
      .limit(32),
    supabase
      .from("products")
      .select("report_type, name, description, unit_amount, currency")
      .order("unit_amount", { ascending: false }),
    supabase
      .from("entitlements")
      .select("id, report_type, status, granted_at")
      .order("granted_at", { ascending: false }),
  ]);

  const profile = profileResult.data;
  const birthProfiles = birthProfileResult.data ?? [];
  const reports = reportResult.data ?? [];
  const dailyReadings = dailyReadingResult.data ?? [];
  const weeklyReadings = weeklyFlags.generationEnabled
    ? ((
        await supabase
          .from("weekly_readings")
          .select(
            "id,week_start_date,week_end_date,reading_start_date,reading_end_date,locale,generated_at,status",
          )
          .order("reading_start_date", { ascending: false })
          .limit(24)
      ).data ?? [])
    : [];
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
  const weeklyAccessible =
    weeklyDecision?.allowed === true || weeklyReadings.length > 0;
  const primaryProfile = birthProfiles.at(-1);
  const commercePlanKey = commerce.checkout
    ? await effectivePlanKeyForUser(authData.user.id)
    : "free";
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
  const latestReport = reports[0];
  const nextStep = readyEntitlements.length
    ? {
        kicker: copy.waitingKicker,
        title: copy.waitingTitle,
        copy: copy.waitingCopy,
        href: "#reports",
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
            title: copy.continueTitle,
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

  return (
    <main className="page-shell private-library account-dashboard">
      <nav className="account-jump-links" aria-label={copy.accountSections}>
        <a href="#overview" aria-current="page">
          {copy.overview}
        </a>
        <a href="#readings">{copy.yourReadingsTitle}</a>
        <a href="#reports">{copy.reportsCombinedTitle}</a>
        <a href="#birth-profiles">{copy.myBirthCharts}</a>
        <a href="#billing">{copy.currentMembership}</a>
        <a href="#account-settings">{copy.settings}</a>
        {adminRole && <Link href="/admin">{copy.adminConsole}</Link>}
      </nav>

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

        <section className="atlas-next-step" aria-labelledby="next-step-title">
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
          <span>
            <strong>{birthProfiles.length}</strong>{" "}
            {birthProfiles.length === 1 ? copy.savedChart : copy.savedCharts}
          </span>
          <span>
            <strong>{reports.length + dailyReadings.length}</strong>{" "}
            {reports.length + dailyReadings.length === 1
              ? copy.privateReading
              : copy.privateReadings}
          </span>
          <span>
            <strong>{readyEntitlements.length}</strong> {copy.readyToGenerate}
          </span>
        </div>

        {notice && (
          <p className="account-notice" role="status">
            {notice}
          </p>
        )}

        <section
          className="dashboard-panel dashboard-panel--readings"
          id="readings"
        >
          <div className="dashboard-panel__heading">
            <div>
              <p className="section-kicker">{copy.yourReadingsKicker}</p>
              <h2>{copy.yourReadingsTitle}</h2>
            </div>
          </div>
          <div className="account-reading-cards">
            <details
              className="account-reading-card account-reading-card--daily"
              id="daily-reading"
            >
              <summary className="account-reading-card__summary">
                <div>
                  <p className="section-kicker">{copy.dailyReadingKicker}</p>
                  <h3>{copy.dailyReadingTitle}</h3>
                </div>
                <span className="account-reading-card__status">
                  <span className="dashboard-panel__meta">
                    {copy.registeredUserEntitlement}
                  </span>
                  <small>{copy.openReadingOptions}</small>
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
                  <p className="section-kicker">{copy.weeklyReadingKicker}</p>
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
                  <small>{copy.openReadingOptions}</small>
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
                <article className="account-report-product" key={reportType}>
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
                        href={`#report-${state.report.id}`}
                      >
                        {copy.openLatestReport}
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

          <div className="account-report-history">
            <h3>{copy.reportHistoryTitle}</h3>
            {reports.length ? (
              <AccountReportList
                initialReports={reports}
                focusReportId={params.focusReport}
              />
            ) : (
              <p className="dashboard-empty">{copy.noReports}</p>
            )}
          </div>
        </section>

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

        <AccountSettings
          displayName={profile?.display_name ?? ""}
          email={authData.user.email ?? ""}
          copy={copy}
          reportLocale={reportLocale}
        />
      </div>
    </main>
  );
}
