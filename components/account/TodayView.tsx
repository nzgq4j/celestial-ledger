import Link from "next/link";
import type { TranslationPack } from "@/lib/i18n/config";
import type { NatalChart } from "@/lib/types";
import {
  memberCopy,
  moonPhaseNames,
  fillCopy,
} from "@/lib/account/member-copy";
import { aspectGlyph, bodyGlyph, signGlyph } from "@/lib/account/astro-glyphs";
import { dailyAllowanceFor, type MemberBase } from "@/lib/account/member-data";
import { currentMoon } from "@/lib/account/sky-now";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import {
  dailyReadingAnalysisSchema,
  dailyReadingContentSchema,
} from "@/lib/daily-readings/domain";
import { buildDailyReadingDayArc } from "@/lib/daily-readings/day-arc";
import {
  dailyFallbackText,
  dailyUserFacingText,
} from "@/lib/daily-readings/presentation";
import {
  isoDateInTimeZone,
  isoWeekStart,
} from "@/lib/weekly-readings/calculation";
import { WEEKLY_READING_CAPABILITY } from "@/lib/weekly-readings/domain";
import { capabilityDecisionForUser } from "@/lib/entitlements/server";
import { tarotReadingFlags, weeklyReadingFlags } from "@/lib/commerce/flags";
import { publishedDailySky } from "@/lib/horoscopes/generated";
import { ATLAS_TRIAL_DAYS, isAtlasMember } from "@/lib/membership/plans";
import { TodayHeading } from "@/components/account/TodayHeading";
import { DailyReadingTodayButton } from "@/components/DailyReadingTodayButton";

export async function TodayView({
  base,
  pack,
}: {
  base: MemberBase;
  pack: TranslationPack;
}) {
  const locale = pack.tag;
  const m = memberCopy[locale];
  const accountCopy = pack.messages.account;
  const now = new Date();
  const atlas = isAtlasMember(base.planKey);
  const tarotEnabled = tarotReadingFlags().enabled;
  const weeklyEnabled = weeklyReadingFlags().generationEnabled;
  const primary = base.primaryProfile;
  const companion = base.activeProfiles.find((item) => item.id !== primary?.id);
  const utcDate = now.toISOString().slice(0, 10);
  const profileDate = primary
    ? isoDateInTimeZone(now, primary.time_zone)
    : utcDate;
  const weekStart = isoWeekStart(new Date(`${profileDate}T12:00:00Z`));
  const recentCutoff = new Date(now.getTime() - 12 * 3_600_000).toISOString();

  const [
    chartRow,
    todayReadings,
    primaryAllowance,
    companionAllowance,
    companionDecision,
    weeklyDecision,
    weeklyThisWeek,
    tarotToday,
    sky,
    latestReport,
  ] = await Promise.all([
    primary
      ? base.supabase
          .from("birth_profiles")
          .select("id,chart")
          .eq("id", primary.id)
          .maybeSingle()
          .then(({ data }) => data)
      : null,
    primary
      ? base.supabase
          .from("daily_readings")
          .select("id,reading_date,generated_at,content,analysis")
          .eq("birth_profile_id", primary.id)
          .gt("expires_at", now.toISOString())
          .or(
            `reading_date.in.(${[...new Set([profileDate, utcDate])].join(",")}),generated_at.gte."${recentCutoff}"`,
          )
          .order("generated_at", { ascending: false })
          .limit(1)
          .then(({ data }) => data ?? [])
      : [],
    primary ? dailyAllowanceFor(base, primary.id) : undefined,
    atlas && companion ? dailyAllowanceFor(base, companion.id) : undefined,
    atlas && !companion
      ? capabilityDecisionForUser(
          base.user.id,
          "daily_reading.companion",
        ).catch(() => undefined)
      : undefined,
    weeklyEnabled
      ? capabilityDecisionForUser(
          base.user.id,
          WEEKLY_READING_CAPABILITY,
        ).catch(() => undefined)
      : undefined,
    weeklyEnabled
      ? base.supabase
          .from("weekly_readings")
          .select("id,status")
          .eq("week_start_date", weekStart)
          .gt("expires_at", now.toISOString())
          .limit(1)
          .then(({ data }) => data?.[0])
      : undefined,
    tarotEnabled
      ? base.supabase
          .from("tarot_readings")
          .select("id")
          .gte("created_at", `${utcDate}T00:00:00.000Z`)
          .gt("expires_at", now.toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .then(({ data }) => data?.[0])
      : undefined,
    publishedDailySky(now, locale).catch(() => undefined),
    base.supabase
      .from("reports")
      .select("id,report_type,created_at,expires_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) =>
        (data ?? []).find(
          (item) => !item.expires_at || new Date(item.expires_at) > now,
        ),
      ),
  ]);

  const chart = (chartRow?.chart ?? undefined) as NatalChart | undefined;
  const placement = (name: string) =>
    chart?.placements.find((item) => item.name === name);
  const sun = placement("Sun");
  const moonPlacement = placement("Moon");
  const ascendant = chart?.timeKnown ? chart.ascendant : undefined;
  const bigThree = [
    sun && {
      key: "sun",
      glyph: bodyGlyph("Sun")!,
      label: m.sun,
      sign: sun.sign,
    },
    moonPlacement && {
      key: "moon",
      glyph: bodyGlyph("Moon")!,
      label: m.moon,
      sign: moonPlacement.sign,
    },
    ascendant && {
      key: "asc",
      glyph: m.ascShort,
      label: m.rising,
      sign: ascendant.sign,
    },
  ].filter(Boolean) as Array<{
    key: string;
    glyph: string;
    label: string;
    sign: string;
  }>;

  const moon = currentMoon(now);
  const moonPhase = moon ? moonPhaseNames[locale][moon.phaseIndex] : undefined;
  const moonLine =
    moon && moonPhase
      ? `${bodyGlyph("Moon")} ${fillCopy(m.moonPhaseIn, {
          phase: moonPhase,
          sign: localizeAstroTerm(moon.sign, locale),
        })}`
      : undefined;

  const reading = todayReadings[0];
  const content = reading
    ? dailyReadingContentSchema.safeParse(reading.content)
    : undefined;
  const analysis = reading
    ? dailyReadingAnalysisSchema.safeParse(reading.analysis)
    : undefined;
  const parsedReading =
    reading && content?.success && analysis?.success
      ? {
          id: reading.id,
          generatedAt: reading.generated_at,
          content: content.data,
          analysis: analysis.data,
        }
      : undefined;

  const formatDay = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(value));

  const sunHoroscope = sun
    ? sky?.horoscopes.find((item) => item.slug === sun.sign.toLowerCase())
    : undefined;

  return (
    <>
      <div className="member-head">
        <TodayHeading
          name={base.displayName || accountCopy.explorer}
          locale={locale}
          moonLine={moonLine}
          greetings={{
            morning: m.greetingMorning,
            afternoon: m.greetingAfternoon,
            evening: m.greetingEvening,
            fallback: m.greetingDefault,
          }}
        />
        {bigThree.length > 0 && (
          <ul className="member-head__chips" aria-label={m.bigThree}>
            {bigThree.map((item) => (
              <li className="atlas-chip" key={item.key}>
                <span aria-hidden="true">{item.glyph}</span>
                <span className="member-sr">{item.label}</span>
                {localizeAstroTerm(item.sign, locale)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="today-grid">
        {!primary ? (
          <article className="atlas-card atlas-card--feature today-feature">
            <p className="atlas-kicker">{m.noChartKicker}</p>
            <h2 className="atlas-section-title today-feature__title">
              {m.noChartTitle}
            </h2>
            <p className="today-feature__body">{m.noChartCopy}</p>
            <div className="member-actions">
              <Link href="/#chart" className="atlas-button">
                {m.noChartAction}
              </Link>
            </div>
          </article>
        ) : parsedReading ? (
          <TodayReading reading={parsedReading} locale={locale} copy={m} />
        ) : (
          <article
            className="atlas-card atlas-card--feature today-feature"
            aria-labelledby="today-feature-title"
          >
            <p className="atlas-kicker">{m.personalReadingKicker}</p>
            {primaryAllowance?.status === "allowance_exhausted" ||
            primaryAllowance?.status === "not_included" ? (
              <>
                <h2
                  id="today-feature-title"
                  className="atlas-section-title today-feature__title"
                >
                  {primaryAllowance.status === "not_included"
                    ? m.notIncludedTitle
                    : m.exhaustedTitle}
                </h2>
                {!atlas && (
                  <p className="today-feature__body">{m.exhaustedCopy}</p>
                )}
                {primaryAllowance.resetsAt &&
                  primaryAllowance.status === "allowance_exhausted" && (
                    <p className="today-feature__note">
                      {fillCopy(m.nextFreeReading, {
                        date: formatDay(primaryAllowance.resetsAt),
                      })}
                    </p>
                  )}
                {!atlas && (
                  <div className="member-actions">
                    <Link href="/membership" className="atlas-button">
                      {fillCopy(m.startTrial, { days: ATLAS_TRIAL_DAYS })}
                    </Link>
                    <Link href="/membership" className="atlas-button-ghost">
                      {m.comparePlans}
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2
                  id="today-feature-title"
                  className="atlas-section-title today-feature__title"
                >
                  {m.noReadingTitle}
                </h2>
                <p className="today-feature__body">{m.noReadingCopy}</p>
                {!primaryAllowance && (
                  <p className="today-feature__note">{m.allowanceUnknown}</p>
                )}
                <DailyReadingTodayButton
                  birthProfileId={primary.id}
                  label={m.generateToday}
                  busyLabel={m.generatingToday}
                  failedLabel={m.generateFailed}
                />
              </>
            )}
          </article>
        )}

        <div className="today-side">
          {tarotEnabled && (
            <Link
              href={tarotToday ? `/account/tarot/${tarotToday.id}` : "/tarot"}
              className="member-link-card today-tarot"
            >
              <span className="today-tarot__card" aria-hidden="true">
                ✦
              </span>
              <span>
                <span className="atlas-kicker">{m.tarotKicker}</span>
                <span className="today-tarot__title">
                  {tarotToday ? m.tarotDrawnTitle : m.tarotTitle}
                </span>
                <span className="today-tarot__copy">
                  {tarotToday ? m.tarotDrawnCopy : m.tarotCopy}
                </span>
              </span>
            </Link>
          )}

          {primary && (
            <AllowanceMeter
              copy={m}
              atlas={atlas}
              primaryAllowance={primaryAllowance}
              companionAllowance={companionAllowance}
              companionTotal={
                companionDecision?.allowed
                  ? (companionDecision.allowance ?? undefined)
                  : undefined
              }
              hasCompanion={Boolean(companion)}
              formatDay={formatDay}
              weekly={
                !weeklyEnabled
                  ? { label: m.weeklyPreparing, tone: "muted" }
                  : weeklyThisWeek
                    ? {
                        label: m.weeklyReady,
                        href: `/weekly-readings/${weeklyThisWeek.id}`,
                        tone: "cyan",
                      }
                    : weeklyDecision?.allowed
                      ? {
                          label: m.weeklyGenerate,
                          href: "/account?view=create#weekly-reading",
                          tone: "cyan",
                        }
                      : {
                          label: m.weeklyAtlas,
                          href: "/membership",
                          tone: "gold",
                        }
              }
            />
          )}

          <Link href="/clock" className="member-link-card today-clock">
            <span className="today-clock__dial" aria-hidden="true">
              {bodyGlyph("Moon")}
            </span>
            <span className="today-clock__text">
              <span className="today-clock__title">{m.clockTitle}</span>
              {moon && moonPhase && (
                <span className="today-clock__copy">
                  {fillCopy(m.clockCopy, {
                    phase: moonPhase,
                    percent: Math.round(moon.illuminated * 100),
                  })}
                </span>
              )}
            </span>
            <span className="member-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </div>

      <div className="today-lower">
        {sunHoroscope ? (
          <Link
            href={`/horoscopes/${sunHoroscope.slug}`}
            className="member-link-card today-teaser"
          >
            <span className="atlas-kicker">
              {signGlyph(sun!.sign)}{" "}
              {fillCopy(m.horoscopeKicker, { sign: sunHoroscope.sign })}
            </span>
            <span className="today-teaser__title">{sunHoroscope.theme}</span>
            <span className="today-teaser__link">{m.allSigns} →</span>
          </Link>
        ) : (
          <Link href="/horoscopes" className="member-link-card today-teaser">
            <span className="atlas-kicker">
              {pack.messages.navigation.dailyHoroscopes}
            </span>
            <span className="today-teaser__link">{m.allSigns} →</span>
          </Link>
        )}
        {latestReport ? (
          <Link
            href={`/reports/${latestReport.id}`}
            className="member-link-card today-teaser"
          >
            <span className="atlas-kicker">{m.continueKicker}</span>
            <span className="today-teaser__title">
              {latestReport.report_type === "recovery_reflection"
                ? accountCopy.recoveryReflection
                : accountCopy.careerPurpose}
            </span>
            <span className="today-teaser__meta">
              {fillCopy(m.savedOn, {
                date: formatDay(latestReport.created_at),
              })}
              {latestReport.expires_at &&
                ` · ${fillCopy(m.keptUntil, { date: formatDay(latestReport.expires_at) })}`}
            </span>
          </Link>
        ) : (
          <Link
            href="/account?view=library"
            className="member-link-card today-teaser"
          >
            <span className="atlas-kicker">{m.reportsKicker}</span>
            <span className="today-teaser__title">{m.reportsTitle}</span>
            <span className="today-teaser__link">{m.exploreReports} →</span>
          </Link>
        )}
      </div>
    </>
  );
}

function TodayReading({
  reading,
  locale,
  copy,
}: {
  reading: {
    id: string;
    generatedAt: string;
    content: ReturnType<typeof dailyReadingContentSchema.parse>;
    analysis: ReturnType<typeof dailyReadingAnalysisSchema.parse>;
  };
  locale: TranslationPack["tag"];
  copy: (typeof memberCopy)[TranslationPack["tag"]];
}) {
  const { content, analysis } = reading;
  const arc = analysis.themes.length ? buildDailyReadingDayArc(analysis) : [];
  const leadingTheme = content.dominantThemes[0]?.label ?? "";
  const evidence = [...analysis.transits]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map((transit) => ({
      id: transit.evidenceId,
      text: [
        bodyGlyph(transit.transitingBody) ?? transit.transitingBody,
        aspectGlyph(transit.aspect) ?? transit.aspect,
        copy.natal,
        bodyGlyph(transit.natalTarget) ??
          localizeAstroTerm(transit.natalTarget, locale),
        `· ${transit.orbDegrees.toFixed(1)}°`,
      ].join(" "),
      label: `${localizeAstroTerm(transit.transitingBody, locale)} ${localizeAstroTerm(transit.aspect, locale)} ${copy.natal} ${localizeAstroTerm(transit.natalTarget, locale)}, ${transit.orbDegrees.toFixed(1)}°`,
    }));
  const generatedTime = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: analysis.observationTimeZone,
  }).format(new Date(reading.generatedAt));
  return (
    <article
      className="atlas-card atlas-card--feature today-feature"
      aria-labelledby="today-feature-title"
    >
      <div className="today-feature__top">
        <p className="atlas-kicker">{copy.personalReadingKicker}</p>
        <span className="today-feature__stamp">
          {fillCopy(copy.generatedAt, { time: generatedTime })}
        </span>
      </div>
      <h2
        id="today-feature-title"
        className="atlas-section-title today-feature__title"
      >
        {content.header.headline}
      </h2>
      <p className="today-feature__body">
        {dailyFallbackText(
          content.bottomLineUpFront.overview.narrative,
          dailyUserFacingText(content.bottomLineUpFront.title) || leadingTheme,
        )}
      </p>
      {arc.length > 0 && (
        <ol className="today-arc" aria-label={copy.dayArc}>
          {arc.map((phase) => (
            <li className="today-arc__item" key={phase.period}>
              <p className="today-arc__when">{phase.label}</p>
              <p className="today-arc__title">{phase.title}</p>
              <p className="today-arc__text">{phase.guidance}</p>
            </li>
          ))}
        </ol>
      )}
      {evidence.length > 0 && (
        <div className="today-evidence">
          <span className="today-evidence__label">{copy.evidence}</span>
          <ul>
            {evidence.map((item) => (
              <li key={item.id} className="atlas-evidence">
                <span aria-hidden="true">{item.text}</span>
                <span className="member-sr">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="member-actions">
        <Link
          href={`/daily-readings/${reading.id}`}
          className="atlas-button-ghost"
        >
          {copy.readFull} →
        </Link>
      </div>
    </article>
  );
}

type MeterTone = "cyan" | "gold" | "muted";

function AllowanceMeter({
  copy,
  atlas,
  primaryAllowance,
  companionAllowance,
  companionTotal,
  hasCompanion,
  formatDay,
  weekly,
}: {
  copy: (typeof memberCopy)[TranslationPack["tag"]];
  atlas: boolean;
  primaryAllowance: Awaited<ReturnType<typeof dailyAllowanceFor>>;
  companionAllowance: Awaited<ReturnType<typeof dailyAllowanceFor>>;
  companionTotal?: number;
  hasCompanion: boolean;
  formatDay: (value: string) => string;
  weekly: { label: string; href?: string; tone: MeterTone };
}) {
  // Atlas members see their companion allowance (the primary chart has a
  // reading every day); Free members see their weekly personal reading.
  const allowance = atlas ? companionAllowance : primaryAllowance;
  const remaining = allowance?.remaining;
  const total = allowance?.allowance ?? undefined;
  const fraction =
    typeof remaining === "number" && total
      ? Math.min(1, Math.max(0, remaining / total))
      : undefined;
  return (
    <article className="atlas-card atlas-card--sm today-meter">
      <p className="atlas-kicker">
        {atlas ? copy.companionKicker : copy.personalKicker}
      </p>
      {remaining === null ? (
        <p className="today-meter__summary">
          <span className="today-meter__count">{copy.unlimited}</span>
          <span className="today-meter__label">{copy.unlimitedCopy}</span>
        </p>
      ) : typeof remaining === "number" && total !== undefined ? (
        <>
          <p className="today-meter__summary">
            <span className="today-meter__count">{remaining}</span>
            <span className="today-meter__label">
              {fillCopy(atlas ? copy.companionLeft : copy.personalLeft, {
                total,
                date: allowance?.resetsAt ? formatDay(allowance.resetsAt) : "—",
              })}
            </span>
          </p>
          <div
            className="atlas-progress today-meter__bar"
            role="meter"
            aria-label={copy.allowanceMeter}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={remaining}
          >
            <span style={{ width: `${Math.round((fraction ?? 0) * 100)}%` }} />
          </div>
        </>
      ) : atlas && !hasCompanion && companionTotal ? (
        <p className="today-meter__summary today-meter__summary--copy">
          {fillCopy(copy.companionAddChart, { total: companionTotal })}
        </p>
      ) : (
        <p className="today-meter__summary today-meter__summary--copy">
          {copy.allowanceUnknown}
        </p>
      )}
      <div className="today-meter__row">
        <span>{copy.weeklyRow}</span>
        {weekly.href ? (
          <Link
            href={weekly.href}
            className={`today-meter__status today-meter__status--${weekly.tone}`}
          >
            {weekly.label}
          </Link>
        ) : (
          <span
            className={`today-meter__status today-meter__status--${weekly.tone}`}
          >
            {weekly.label}
          </span>
        )}
      </div>
    </article>
  );
}
