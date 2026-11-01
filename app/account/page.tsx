import Link from "next/link";
import { redirect } from "next/navigation";
import "@/app/styles/atlas-member.css";
import { AccountNavigation } from "@/components/AccountNavigation";
import { AccountLibrary, type SavedReading } from "@/components/AccountLibrary";
import { AccountSettings } from "@/components/AccountSettings";
import { DailyReadingGenerator } from "@/components/DailyReadingGenerator";
import { WeeklyReadingGenerator } from "@/components/WeeklyReadingGenerator";
import { AccountTarotDailyDraw } from "@/components/AccountTarotDailyDraw";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { MorningAlertToggle } from "@/components/native/MorningAlertToggle";
import { SiteLinksSection } from "@/components/account/SiteLinksSection";
import { RestorePurchasesButton } from "@/components/native/PlayBillingButton";
import { TodayView } from "@/components/account/TodayView";
import { ChartView } from "@/components/account/ChartView";
import { ReportOffers } from "@/components/account/ReportOffers";
import { workspaceCopy } from "@/lib/account/workspace-copy";
import { memberCopy, fillCopy } from "@/lib/account/member-copy";
import {
  dailyAllowanceFor,
  loadMemberBase,
  loadReportContext,
  loadSavedReadings,
} from "@/lib/account/member-data";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { tarotReadingFlags, weeklyReadingFlags } from "@/lib/commerce/flags";
import { capabilityDecisionForUser } from "@/lib/entitlements/server";
import { WEEKLY_READING_CAPABILITY } from "@/lib/weekly-readings/domain";
import { listActiveTarotDecksForPlan } from "@/lib/tarot/decks";
import { dailyAllowanceLabel } from "@/lib/daily-readings/allowance";
import {
  ATLAS_TRIAL_DAYS,
  PLAN_ALLOWANCES,
  isAtlasMember,
  membershipPlanFor,
} from "@/lib/membership/plans";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const pack = await getServerTranslationPack();
  return {
    title: pack.messages.account.metadataTitle,
    robots: { index: false, follow: false, nocache: true },
  };
}

const views = ["library", "create", "charts", "membership", "settings"];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string;
    focusReport?: string;
    view?: string;
    chart?: string;
  }>;
}) {
  const [pack, params, base] = await Promise.all([
    getServerTranslationPack(),
    searchParams,
    loadMemberBase(),
  ]);
  if (!base) redirect("/auth/login");
  const copy = pack.messages.account;
  const m = memberCopy[pack.tag];
  const view = params.focusReport
    ? "library"
    : views.includes(params.view ?? "")
      ? params.view!
      : "overview";
  const reportLocale = base.reportLocale ?? pack.tag;
  const reportProfiles = base.activeProfiles.map(({ id, label }) => ({
    id,
    label,
  }));
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(pack.tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <main className="atlas-shell member-page" data-view={view}>
      <AccountNavigation
        view={view}
        copy={{
          label: m.accountSections,
          settings: m.tabSettings,
          membership: m.tabBilling,
          create: m.tabCreate,
        }}
        admin={Boolean(base.adminRole)}
        adminLabel={copy.adminConsole}
      />

      {view === "overview" && <TodayView base={base} pack={pack} />}

      {view === "charts" && (
        <ChartView base={base} pack={pack} selectedId={params.chart} />
      )}

      {view === "library" && (
        <LibraryView
          base={base}
          pack={pack}
          reportLocale={reportLocale}
          reportProfiles={reportProfiles}
          focusReportId={params.focusReport}
        />
      )}

      {view === "create" && (
        <CreateView
          base={base}
          pack={pack}
          reportLocale={reportLocale}
          reportProfiles={reportProfiles}
        />
      )}

      {view === "membership" && (
        <MembershipView base={base} pack={pack} formatDate={formatDate} />
      )}

      {view === "settings" && (
        <>
          <header className="member-head member-head--stacked">
            <div>
              <p className="atlas-kicker">{m.settingsKicker}</p>
              <h1 className="atlas-page-title">{m.settingsTitle}</h1>
            </div>
          </header>
          <SettingsNotice notice={params.notice} copy={copy} />
          <AccountSettings
            displayName={base.profile?.display_name ?? ""}
            email={base.user.email ?? ""}
            copy={copy}
            reportLocale={reportLocale}
          />
          <section className="atlas-card member-app-settings" data-app-only>
            <MorningAlertToggle />
            <RestorePurchasesButton className="atlas-button-ghost" />
          </section>
          <SiteLinksSection />
        </>
      )}
    </main>
  );
}

function SettingsNotice({
  notice,
  copy,
}: {
  notice?: string;
  copy: Record<string, string>;
}) {
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
  const message = notice ? notices[notice] : undefined;
  if (!message) return null;
  return (
    <p className="member-notice" role="status">
      {message}
    </p>
  );
}

type ViewProps = {
  base: NonNullable<Awaited<ReturnType<typeof loadMemberBase>>>;
  pack: Awaited<ReturnType<typeof getServerTranslationPack>>;
};

async function LibraryView({
  base,
  pack,
  reportLocale,
  reportProfiles,
  focusReportId,
}: ViewProps & {
  reportLocale: (typeof pack)["tag"];
  reportProfiles: Array<{ id: string; label: string }>;
  focusReportId?: string;
}) {
  const copy = pack.messages.account;
  const ui = workspaceCopy[pack.tag];
  const m = memberCopy[pack.tag];
  const [reportContext, saved] = await Promise.all([
    loadReportContext(base),
    loadSavedReadings(base, {
      weeklyEnabled: weeklyReadingFlags().generationEnabled,
    }),
  ]);
  const dateLabel = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Date(value).toLocaleDateString(pack.tag, {
      timeZone: "UTC",
      ...options,
    });
  const savedReadings: SavedReading[] = [
    ...saved.tarotReadings.map((item) => ({
      id: item.id,
      title: item.title,
      kind: "tarot" as const,
      date: item.created_at,
      expiresAt: item.expires_at,
      locale: item.locale,
      status: copy.statusCompleted,
      href: `/account/tarot/${item.id}`,
    })),
    ...saved.dailyReadings.map((item) => ({
      id: item.id,
      title: `${m.kindDaily} · ${dateLabel(`${item.reading_date}T12:00:00Z`, { day: "numeric", month: "long" })}`,
      kind: "daily" as const,
      date: item.generated_at,
      expiresAt: item.expires_at,
      locale: item.locale,
      status: copy.statusCompleted,
      href: `/daily-readings/${item.id}`,
    })),
    ...saved.weeklyReadings.map((item) => ({
      id: item.id,
      title: `${m.kindWeekly} · ${dateLabel(`${item.reading_start_date}T12:00:00Z`, { day: "numeric", month: "short" })} – ${dateLabel(`${item.reading_end_date}T12:00:00Z`, { day: "numeric", month: "short" })}`,
      kind: "weekly" as const,
      date: item.generated_at,
      expiresAt: item.expires_at,
      locale: item.locale,
      status: item.status === "completed" ? copy.statusCompleted : item.status,
      href: `/weekly-readings/${item.id}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <header className="member-head member-head--stacked">
        <div>
          <p className="atlas-kicker">{m.reportsKicker}</p>
          <h1 className="atlas-page-title">{m.reportsTitle}</h1>
        </div>
      </header>
      <ReportOffers
        pack={pack}
        prices={reportContext.reportPrices}
        member={{
          states: reportContext.reportStates,
          primaryReportType: reportContext.primaryReportType,
          planKey: base.planKey,
          profiles: reportProfiles,
          reportLocale,
          checkoutEnabled: base.commerce.checkout,
          availableReportCredits: reportContext.availableReportCredits,
        }}
      />
      <AccountLibrary
        readings={savedReadings}
        reports={reportContext.reports}
        copy={ui}
        member={m}
        locale={pack.tag}
        focusReportId={focusReportId}
      />
    </>
  );
}

async function CreateView({
  base,
  pack,
  reportLocale,
  reportProfiles,
}: ViewProps & {
  reportLocale: (typeof pack)["tag"];
  reportProfiles: Array<{ id: string; label: string }>;
}) {
  const copy = pack.messages.account;
  const m = memberCopy[pack.tag];
  const weeklyFlags = weeklyReadingFlags();
  const tarotFlags = tarotReadingFlags();
  const { activeProfiles, primaryProfile } = base;
  const [reportContext, saved, dailyAllowances, weeklyDecision, tarotDecks] =
    await Promise.all([
      loadReportContext(base),
      loadSavedReadings(base, { weeklyEnabled: weeklyFlags.generationEnabled }),
      Promise.all(
        activeProfiles.map(
          async (profile) =>
            [profile.id, await dailyAllowanceFor(base, profile.id)] as const,
        ),
      ).then((entries) => Object.fromEntries(entries)),
      weeklyFlags.generationEnabled
        ? capabilityDecisionForUser(base.user.id, WEEKLY_READING_CAPABILITY)
        : null,
      tarotFlags.enabled
        ? listActiveTarotDecksForPlan(base.planKey, pack.tag)
        : [],
    ]);
  const weeklyAccessible = weeklyDecision?.allowed === true;

  return (
    <>
      <header className="member-head member-head--stacked">
        <div>
          <p className="atlas-kicker">{m.createKicker}</p>
          <h1 className="atlas-page-title">{m.createTitle}</h1>
          <p className="member-lede">{m.createIntro}</p>
        </div>
      </header>
      <section
        className="create-readings"
        id="readings"
        aria-label={copy.yourReadingsTitle}
      >
        <details className="create-card" id="daily-reading">
          <summary className="create-card__summary">
            <span>
              <span className="atlas-kicker">{copy.dailyReadingKicker}</span>
              <span className="create-card__title">
                {copy.dailyReadingTitle}
              </span>
            </span>
            <span className="create-card__status">
              {dailyAllowanceLabel(
                primaryProfile ? dailyAllowances[primaryProfile.id] : undefined,
                pack.tag,
              )}
            </span>
          </summary>
          <div className="create-card__body">
            <p className="member-note">{copy.dailyReadingDescription}</p>
            <DailyReadingGenerator
              profiles={activeProfiles.map(({ id, label }) => ({ id, label }))}
              allowances={dailyAllowances}
              primaryProfileId={primaryProfile?.id}
              existingReadings={saved.dailyReadings}
            />
          </div>
        </details>

        <details className="create-card" id="weekly-reading">
          <summary className="create-card__summary">
            <span>
              <span className="atlas-kicker">{copy.weeklyReadingKicker}</span>
              <span className="create-card__title">
                {copy.weeklyReadingTitle}
              </span>
            </span>
            <span className="create-card__status">
              {!weeklyFlags.generationEnabled
                ? copy.weeklyReadingUnavailableTitle
                : weeklyAccessible
                  ? saved.weeklyReadings.length
                    ? copy.weeklyReadingEntitled
                    : copy.weeklyReadingReady
                  : copy.weeklyReadingUpsellTitle}
            </span>
          </summary>
          <div className="create-card__body">
            {!weeklyFlags.generationEnabled ? (
              <p className="member-note">{copy.weeklyReadingUnavailableCopy}</p>
            ) : weeklyAccessible ? (
              <>
                <p className="member-note">{copy.weeklyReadingDescription}</p>
                <WeeklyReadingGenerator
                  primaryProfile={
                    primaryProfile
                      ? { id: primaryProfile.id, label: primaryProfile.label }
                      : undefined
                  }
                  existingReadings={saved.weeklyReadings}
                />
              </>
            ) : (
              <div className="create-card__upsell">
                <p className="member-note">{copy.weeklyReadingUpsellCopy}</p>
                <Link href="/membership" className="atlas-button-ghost">
                  {fillCopy(m.startTrial, { days: ATLAS_TRIAL_DAYS })}
                </Link>
              </div>
            )}
          </div>
        </details>

        {tarotFlags.enabled && (
          <details className="create-card" id="tarot-daily-draw">
            <summary className="create-card__summary">
              <span>
                <span className="atlas-kicker">
                  {pack.messages.tarot.accountDailyKicker}
                </span>
                <span className="create-card__title">
                  {pack.messages.tarot.accountDailyTitle}
                </span>
              </span>
              <span className="create-card__status">
                {pack.messages.tarot.includedWithPlan}
              </span>
            </summary>
            <div className="create-card__body">
              <p className="member-note">
                {pack.messages.tarot.accountDailyDescription}
              </p>
              <AccountTarotDailyDraw
                decks={[...tarotDecks]}
                currentPlan={base.planKey}
                locale={pack.tag}
                copy={pack.messages.tarot}
              />
            </div>
          </details>
        )}
      </section>

      <section
        className="create-reports"
        id="reports"
        aria-labelledby="create-reports-title"
      >
        <h2 id="create-reports-title" className="member-subtitle">
          {copy.reportsCombinedTitle}
        </h2>
        <p className="member-note">{copy.reportDelivery}</p>
        <ReportOffers
          pack={pack}
          prices={reportContext.reportPrices}
          member={{
            states: reportContext.reportStates,
            primaryReportType: reportContext.primaryReportType,
            planKey: base.planKey,
            profiles: reportProfiles,
            reportLocale,
            checkoutEnabled: base.commerce.checkout,
            availableReportCredits: reportContext.availableReportCredits,
          }}
        />
      </section>
    </>
  );
}

async function MembershipView({
  base,
  pack,
  formatDate,
}: ViewProps & { formatDate: (value: string) => string }) {
  const copy = pack.messages.account;
  const ui = workspaceCopy[pack.tag];
  const m = memberCopy[pack.tag];
  const weeklyFlags = weeklyReadingFlags();
  const tarotFlags = tarotReadingFlags();
  const atlas = isAtlasMember(base.planKey);
  const subscription = base.subscription;
  const [chartDecision, weeklyDecision, reportContext] = await Promise.all([
    capabilityDecisionForUser(base.user.id, "birth_profiles.saved").catch(
      () => undefined,
    ),
    weeklyFlags.generationEnabled
      ? capabilityDecisionForUser(
          base.user.id,
          WEEKLY_READING_CAPABILITY,
        ).catch(() => undefined)
      : undefined,
    loadReportContext(base),
  ]);
  const planName =
    membershipPlanFor(subscription?.plan_key ?? base.planKey) === "atlas"
      ? m.planAtlas
      : m.planFree;
  const timing = !subscription?.current_period_end
    ? undefined
    : subscription.status === "past_due"
      ? m.pastDue
      : subscription.status === "trialing"
        ? fillCopy(m.trialEnds, {
            date: formatDate(subscription.current_period_end),
          })
        : subscription.cancel_at_period_end
          ? fillCopy(m.accessEnds, {
              date: formatDate(subscription.current_period_end),
            })
          : fillCopy(m.renews, {
              date: formatDate(subscription.current_period_end),
            });
  const subscriptionPill =
    subscription?.status === "trialing"
      ? { label: m.statusTrial, tone: "gold" }
      : subscription?.status === "past_due"
        ? { label: m.statusPastDue, tone: "red" }
        : subscription?.status === "active"
          ? { label: copy.activeStatus, tone: "cyan" }
          : undefined;
  const access: Array<[string, string]> = [
    [
      ui.charts,
      chartDecision?.allowed && chartDecision.allowance !== null
        ? fillCopy(m.savedChartsUsage, {
            used: base.activeProfiles.length,
            total: chartDecision.allowance,
          })
        : String(base.activeProfiles.length),
    ],
    [
      ui.weekly,
      !weeklyFlags.generationEnabled
        ? ui.unavailable
        : weeklyDecision?.allowed
          ? weeklyDecision.source !== "plan"
            ? ui.grantAccess
            : ui.planIncluded
          : ui.notIncluded,
    ],
    [m.kindTarot, tarotFlags.enabled ? ui.planIncluded : ui.unavailable],
    [ui.credits, String(reportContext.availableReportCredits)],
    [ui.purchases, String(reportContext.readyEntitlements.length)],
  ];

  return (
    <>
      <header className="member-head member-head--stacked">
        <div>
          <p className="atlas-kicker">{m.billingKicker}</p>
          <h1 className="atlas-page-title">{m.billingTitle}</h1>
        </div>
      </header>
      <div className="billing-grid" id="billing">
        <article
          className={`atlas-card billing-plan${atlas ? " atlas-card--feature" : ""}`}
          aria-labelledby="billing-plan-name"
        >
          <div className="billing-plan__top">
            <h2 id="billing-plan-name" className="billing-plan__name">
              {planName}
            </h2>
            {subscriptionPill && (
              <span
                className={`member-pill member-pill--${subscriptionPill.tone}`}
              >
                {subscriptionPill.label}
              </span>
            )}
          </div>
          {timing && <p className="billing-plan__timing">{timing}</p>}
          <p className="billing-plan__summary">
            {atlas
              ? fillCopy(m.atlasSummary, {
                  charts: PLAN_ALLOWANCES.atlas.savedCharts,
                  companions: PLAN_ALLOWANCES.atlas.companionReadingsPerMonth,
                })
              : m.freeSummary}
          </p>
          {base.adminRole === "site_admin" && (
            <p className="member-note">{ui.adminAccess}</p>
          )}
          <div className="member-actions">
            {subscription ? (
              <BillingPortalButton provider={subscription.provider} />
            ) : (
              <Link className="atlas-button" href="/membership">
                {atlas
                  ? m.comparePlans
                  : fillCopy(m.startTrial, { days: ATLAS_TRIAL_DAYS })}
              </Link>
            )}
            {!atlas && subscription && (
              <Link className="atlas-button-ghost" href="/membership">
                {m.seeAtlas}
              </Link>
            )}
          </div>
        </article>
        <section
          className="atlas-card billing-access"
          aria-labelledby="access-heading"
        >
          <h2 id="access-heading" className="member-subtitle">
            {m.accessTitle}
          </h2>
          <dl className="billing-access__list">
            {access.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
