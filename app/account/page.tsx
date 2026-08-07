import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/AccountSettings";
import { BirthProfileList } from "@/components/BirthProfileList";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import { AccountReportList } from "@/components/AccountReportList";
import { DailyReadingGenerator } from "@/components/DailyReadingGenerator";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { isLocaleTag } from "@/lib/i18n/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { commerceFlags } from "@/lib/commerce/flags";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { CheckoutButton } from "@/components/CheckoutButton";
import { effectivePlanKeyForUser } from "@/lib/entitlements/server";

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
      .select("display_name, adult_confirmed_at, created_at, report_locale")
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
      <aside className="account-sidebar" aria-label={copy.accountSections}>
        <div className="account-sidebar__identity">
          <span className="account-sidebar__seal" aria-hidden="true">
            <i />
          </span>
          <div>
            <p>Celestial Atlas</p>
            <strong>{copy.dashboardWorkspaceName}</strong>
            <small>{copy.dashboardWorkspaceCopy}</small>
          </div>
        </div>

        <nav className="account-sidebar__nav">
          <p>{copy.workspaceLabel}</p>
          <a href="#overview" className="account-sidebar__active">
            <span aria-hidden="true">01</span>
            {copy.overview}
          </a>
          <a href="#daily-reading">
            <span aria-hidden="true">02</span>
            {copy.myDailyReading}
          </a>
          <a href="#reports">
            <span aria-hidden="true">03</span>
            {copy.myReadings}
          </a>
          <a href="#purchased-reports">
            <span aria-hidden="true">P</span>
            {copy.purchasedReportsTitle}
          </a>
          <a href="#birth-profiles">
            <span aria-hidden="true">04</span>
            {copy.myBirthCharts}
          </a>
          <p>{copy.accountLabel}</p>
          {commerce.subscriptions && (
            <a href="#billing">
              <span aria-hidden="true">05</span>
              {copy.membershipBilling}
            </a>
          )}
          <a href="#account-settings">
            <span aria-hidden="true">06</span>
            {copy.settings}
          </a>
          {adminRole && (
            <Link href="/admin">
              <span aria-hidden="true">07</span>
              {copy.adminConsole}
            </Link>
          )}
        </nav>

        <div className="account-sidebar__plan">
          <p>{copy.currentOrbit}</p>
          <strong>
            {commercePlanKey === "free"
              ? copy.freePlan
              : commercePlanKey[0].toUpperCase() + commercePlanKey.slice(1)}
          </strong>
          <Link href="/membership">{copy.viewMembership}</Link>
        </div>
      </aside>

      <div className="account-workspace">
        <header className="account-command-bar">
          <div>
            <p>{copy.privateObservatory}</p>
            <strong>{copy.dashboardTitle}</strong>
          </div>
          <div
            className="account-command-bar__signals"
            aria-label="Account summary"
          >
            <span>
              <small>{copy.chartsLabel}</small>
              <strong>{birthProfiles.length}</strong>
            </span>
            <span>
              <small>{copy.readingsLabel}</small>
              <strong>{reports.length + dailyReadings.length}</strong>
            </span>
            <span>
              <small>{copy.readyLabel}</small>
              <strong>{readyEntitlements.length}</strong>
            </span>
          </div>
          <div className="account-command-bar__actions">
            <Link href="/" className="account-command-bar__return">
              <span aria-hidden="true">←</span>
              {copy.backToSite}
            </Link>
            <div className="account-command-bar__profile">
              <span aria-hidden="true">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{displayName}</strong>
                <small>{authData.user.email}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="account-activity-grid">
          <header className="account-hero" id="overview">
            <div className="account-hero__welcome">
              <p className="eyebrow">{copy.heroKicker}</p>
              <h1>{copy.privateSkyTitle}</h1>
              <p>{copy.heroCopy}</p>
            </div>
            <div className="account-hero__orbit" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </header>

          <section
            className="atlas-next-step"
            aria-labelledby="next-step-title"
          >
            <div>
              <p className="section-kicker">{nextStep.kicker}</p>
              <h2 id="next-step-title">{nextStep.title}</h2>
              <p>{nextStep.copy}</p>
            </div>
            <Link href={nextStep.href} className="button-primary">
              {nextStep.action}
            </Link>
          </section>
        </div>

        <div className="account-stats" aria-label={copy.accountSummary}>
          <span>
            <i
              className="account-stat-icon account-stat-icon--cyan"
              aria-hidden="true"
            >
              ✦
            </i>
            <strong>{birthProfiles.length}</strong>{" "}
            {birthProfiles.length === 1 ? copy.savedChart : copy.savedCharts}
          </span>
          <span>
            <i
              className="account-stat-icon account-stat-icon--violet"
              aria-hidden="true"
            >
              ◌
            </i>
            <strong>{reports.length + dailyReadings.length}</strong>{" "}
            {reports.length + dailyReadings.length === 1
              ? copy.privateReading
              : copy.privateReadings}
          </span>
          <span>
            <i
              className="account-stat-icon account-stat-icon--coral"
              aria-hidden="true"
            >
              ↗
            </i>
            <strong>{readyEntitlements.length}</strong> {copy.readyToGenerate}
          </span>
        </div>

        {notice && (
          <p className="account-notice" role="status">
            {notice}
          </p>
        )}

        {commerce.subscriptions && (
          <section className="dashboard-panel" id="billing">
            <div className="dashboard-panel__heading">
              <div>
                <p className="section-kicker">{copy.membershipBilling}</p>
                <h2>
                  {subscription
                    ? `${subscription.plan_key[0].toUpperCase()}${subscription.plan_key.slice(1)}`
                    : copy.freePlan}
                </h2>
              </div>
              <span className="dashboard-panel__meta">
                {subscription?.status ?? copy.activeStatus}
              </span>
            </div>
            <p className="dashboard-panel__introduction">
              {subscription?.current_period_end
                ? `${subscription.cancel_at_period_end ? copy.accessEnds : copy.nextBillingDate} ${new Date(subscription.current_period_end).toLocaleDateString(pack.tag)}.`
                : copy.freePlanDescription}
            </p>
            {subscription && <BillingPortalButton />}
          </section>
        )}

        <section
          className="dashboard-panel dashboard-panel--daily"
          id="daily-reading"
        >
          <div className="dashboard-panel__heading">
            <div>
              <p className="section-kicker">{copy.dailyReadingKicker}</p>
              <h2>{copy.dailyReadingTitle}</h2>
            </div>
            <span className="dashboard-panel__meta">
              {copy.registeredUserEntitlement}
            </span>
          </div>
          <p className="dashboard-panel__introduction">
            {copy.dailyReadingDescription}
          </p>
          <DailyReadingGenerator
            profiles={birthProfiles.map((item) => ({
              id: item.id,
              label: item.label,
            }))}
            existingReadings={dailyReadings}
          />
        </section>

        <section
          className="dashboard-panel dashboard-panel--purchased"
          id="purchased-reports"
        >
          <div className="dashboard-panel__heading">
            <div>
              <p className="section-kicker">{copy.purchasedReportsKicker}</p>
              <h2>{copy.purchasedReportsTitle}</h2>
            </div>
            <span className="dashboard-panel__meta">
              {readyEntitlements.length} {copy.readyToGenerate}
            </span>
          </div>
          <p className="dashboard-panel__introduction">
            {copy.purchasedReportsDescription}
          </p>

          {readyEntitlements.length ? (
            <div className="purchased-report-list">
              {readyEntitlements.map((entitlement) => (
                <article className="ready-report" key={entitlement.id}>
                  <div>
                    <strong>
                      {entitlement.report_type === "recovery_reflection"
                        ? copy.recoveryReflection
                        : copy.careerPurpose}
                    </strong>
                    <p>{copy.purchasedReady}</p>
                    <small>
                      {copy.purchasedOn}{" "}
                      {new Date(entitlement.granted_at).toLocaleDateString(
                        pack.tag,
                      )}
                    </small>
                  </div>
                  <GenerateReportButton
                    entitlementId={entitlement.id}
                    reportType={entitlement.report_type}
                    profiles={birthProfiles.map((item) => ({
                      id: item.id,
                      label: item.label,
                    }))}
                    defaultLocale={reportLocale}
                  />
                </article>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">{copy.noUnusedPurchases}</p>
          )}
        </section>

        <section
          className="dashboard-panel dashboard-panel--reports"
          id="reports"
        >
          <div className="dashboard-panel__heading">
            <div>
              <p className="section-kicker">{copy.libraryKicker}</p>
              <h2>{copy.readingsTitle}</h2>
            </div>
            <span className="dashboard-panel__meta">
              {reports.length} {copy.saved}
            </span>
          </div>

          {reports.length ? (
            <AccountReportList
              initialReports={reports}
              focusReportId={params.focusReport}
            />
          ) : (
            <p className="dashboard-empty">{copy.noReports}</p>
          )}

          <div className="compact-products">
            {products
              .filter((product) =>
                ["career_purpose", "recovery_reflection"].includes(
                  product.report_type,
                ),
              )
              .map((product) => (
                <article key={product.report_type}>
                  <div>
                    <h3>
                      {product.report_type === "recovery_reflection"
                        ? copy.recoveryReflection
                        : copy.careerPurpose}
                    </h3>
                    <p>
                      {product.report_type === "recovery_reflection"
                        ? copy.recoveryDescription
                        : copy.careerDescription}
                    </p>
                    <small className="compact-products__delivery">
                      {copy.reportDelivery}
                    </small>
                  </div>
                  <div className="compact-products__action compact-products__action--complimentary">
                    {commerce.checkout && birthProfiles.length ? (
                      (() => {
                        const outstandingEntitlement = readyEntitlements.find(
                          (entitlement) =>
                            entitlement.report_type === product.report_type,
                        );
                        const price = reportPrices?.find(
                          (candidate) =>
                            candidate.report_type === product.report_type,
                        );
                        return outstandingEntitlement ? (
                          <GenerateReportButton
                            entitlementId={outstandingEntitlement.id}
                            reportType={product.report_type}
                            profiles={birthProfiles.map((item) => ({
                              id: item.id,
                              label: item.label,
                            }))}
                            defaultLocale={reportLocale}
                          />
                        ) : commercePlanKey === "premium" ? (
                          <div>
                            <strong>{copy.includedWithPremium}</strong>
                            <GenerateReportButton
                              reportType={product.report_type}
                              profiles={birthProfiles.map((item) => ({
                                id: item.id,
                                label: item.label,
                              }))}
                              defaultLocale={reportLocale}
                            />
                          </div>
                        ) : price ? (
                          <CheckoutButton
                            reportType={product.report_type}
                            priceLabel={new Intl.NumberFormat(pack.tag, {
                              style: "currency",
                              currency: price.currency.toUpperCase(),
                            }).format(price.unit_amount / 100)}
                            creditAvailable={availableReportCredits > 0}
                          />
                        ) : (
                          <strong>{copy.currentlyUnavailable}</strong>
                        );
                      })()
                    ) : birthProfiles.length ? (
                      <>
                        <strong>{copy.complimentary}</strong>
                        <GenerateReportButton
                          reportType={product.report_type}
                          profiles={birthProfiles.map((item) => ({
                            id: item.id,
                            label: item.label,
                          }))}
                          defaultLocale={reportLocale}
                        />
                      </>
                    ) : (
                      <Link href="/#chart" className="button-primary">
                        {copy.createNatalChart}
                      </Link>
                    )}
                  </div>
                </article>
              ))}
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
