import Link from "next/link";
import type { TranslationPack } from "@/lib/i18n/config";
import type { NatalChart, Placement } from "@/lib/types";
import { memberCopy, fillCopy } from "@/lib/account/member-copy";
import {
  aspectGlyph,
  bodyGlyph,
  degreeMinute,
  signGlyph,
} from "@/lib/account/astro-glyphs";
import type { MemberBase } from "@/lib/account/member-data";
import { localizeAstroTerm } from "@/lib/reports/evidence-label";
import { capabilityDecisionForUser } from "@/lib/entitlements/server";
import { NatalChartWheel } from "@/components/NatalChartWheel";
import { BirthProfileList } from "@/components/BirthProfileList";
import {
  ChartDataTabs,
  type ChartDataTab,
} from "@/components/account/ChartDataTabs";

const chartBodies = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "North Node",
];

/**
 * Heading and first two paragraphs of the saved natal interpretation, parsed
 * the same way NatalInterpretation splits its numbered chapters.
 */
function interpretationExcerpt(text: string) {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+(?=(?:#{1,3}\s*)?\d{1,2}\.\s+[A-Z])/g, "\n")
    .trim();
  const first =
    normalized.split(/\n(?=(?:#{1,3}\s*)?\d{1,2}\.\s+)/).find(Boolean) ?? "";
  const lines = first.trim().split("\n");
  const numbered = /^(?:#{1,3}\s*)?\d{1,2}\.\s+/.test(lines[0] ?? "");
  const heading = numbered
    ? lines
        .shift()!
        .replace(/^#{1,3}\s*/, "")
        .replace(/^\d{1,2}\.\s*/, "")
    : undefined;
  const paragraphs = (numbered ? lines.join("\n") : normalized)
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/^#{1,3}\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 2);
  return { heading, paragraphs };
}

export async function ChartView({
  base,
  pack,
  selectedId,
}: {
  base: MemberBase;
  pack: TranslationPack;
  selectedId?: string;
}) {
  const locale = pack.tag;
  const m = memberCopy[locale];
  const accountCopy = pack.messages.account;
  const profiles = [...base.activeProfiles].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
  const selected =
    profiles.find((item) => item.id === selectedId) ?? base.primaryProfile;

  if (!selected)
    return (
      <>
        <div className="member-head">
          <div>
            <p className="atlas-kicker">{m.noChartKicker}</p>
            <h1 className="atlas-page-title">{m.noChartTitle}</h1>
          </div>
        </div>
        <article className="atlas-card atlas-card--feature member-empty">
          <p className="today-feature__body">{m.noChartCopy}</p>
          <div className="member-actions">
            <Link href="/#chart" className="atlas-button">
              {m.noChartAction}
            </Link>
          </div>
        </article>
      </>
    );

  const [{ data: row }, chartDecision] = await Promise.all([
    base.supabase
      .from("birth_profiles")
      .select("id,label,chart,natal_reading")
      .eq("id", selected.id)
      .maybeSingle(),
    capabilityDecisionForUser(base.user.id, "birth_profiles.saved").catch(
      () => undefined,
    ),
  ]);
  const chart = (row?.chart ?? undefined) as NatalChart | undefined;
  const isPrimary = selected.id === base.primaryProfile?.id;
  const nameFor = (profile: (typeof profiles)[number], index: number) => {
    if (profile.id === base.primaryProfile?.id && base.displayName)
      return base.displayName;
    const duplicates = profiles.filter((item) => item.label === profile.label);
    return duplicates.length > 1
      ? `${profile.label} ${index + 1}`
      : profile.label;
  };
  const selectedName = nameFor(
    selected,
    profiles.findIndex((item) => item.id === selected.id),
  );
  const canAddChart =
    chartDecision?.allowed === true &&
    (chartDecision.allowance === null ||
      profiles.length < chartDecision.allowance);

  const sign = (value: string) => localizeAstroTerm(value, locale);
  const placementNote = (placement: Placement | undefined) =>
    placement
      ? [
          degreeMinute(placement.degree, placement.minute),
          placement.house ? fillCopy(m.houseN, { n: placement.house }) : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : "";
  const find = (name: string) =>
    chart?.placements.find((item) => item.name === name);
  const ascendant = chart?.timeKnown ? chart.ascendant : undefined;
  const bigThree = [
    {
      key: "sun",
      glyph: bodyGlyph("Sun")!,
      label: m.sun,
      placement: find("Sun"),
    },
    {
      key: "moon",
      glyph: bodyGlyph("Moon")!,
      label: m.moon,
      placement: find("Moon"),
    },
    { key: "asc", glyph: m.ascShort, label: m.rising, placement: ascendant },
  ].filter((item) => item.placement);

  // Birth details render server-side only, from the saved chart record.
  const input = chart?.input;
  const birthDate = input?.date
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${input.date}T12:00:00Z`))
    : selected.birth_date;
  const utcTime =
    chart?.timeKnown && chart.utc
      ? `${m.utc} ${new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }).format(new Date(chart.utc))}`
      : undefined;
  const meta = [
    birthDate,
    chart?.timeKnown && input?.time ? input.time : m.timeUnknown,
    input?.place.displayName ?? selected.display_name,
    utcTime,
  ]
    .filter(Boolean)
    .join(" · ");

  const tabs: ChartDataTab[] = chart
    ? [
        {
          id: "planets",
          label: m.tabPlanets,
          empty: "",
          rows: chartBodies
            .map((name) => find(name))
            .filter((item): item is Placement => Boolean(item))
            .map((placement) => ({
              key: placement.name,
              glyph: bodyGlyph(placement.name) ?? "",
              name: sign(placement.name),
              value: `${degreeMinute(placement.degree, placement.minute)} ${signGlyph(placement.sign) ?? ""}`,
              valueLabel: `${degreeMinute(placement.degree, placement.minute)} ${sign(placement.sign)}`,
              note: [
                placement.house
                  ? fillCopy(m.houseN, { n: placement.house })
                  : "",
                placement.retrograde ? "℞︎" : "",
              ]
                .filter(Boolean)
                .join(" "),
            })),
        },
        {
          id: "houses",
          label: m.tabHouses,
          empty: m.noHouses,
          rows: chart.timeKnown
            ? chart.houses.map((house) => ({
                key: String(house.house),
                glyph: String(house.house),
                name: fillCopy(m.houseN, { n: house.house }),
                value: `${degreeMinute(house.degree, house.minute)} ${signGlyph(house.sign) ?? ""}`,
                valueLabel: `${degreeMinute(house.degree, house.minute)} ${sign(house.sign)}`,
                note: "",
              }))
            : [],
        },
        {
          id: "aspects",
          label: m.tabAspects,
          empty: m.noAspects,
          rows: [...chart.aspects]
            .sort((a, b) => a.orb - b.orb)
            .map((aspect) => ({
              key: `${aspect.body1}-${aspect.body2}-${aspect.type}`,
              glyph: aspectGlyph(aspect.type) ?? "",
              name: `${sign(aspect.body1)} – ${sign(aspect.body2)}`,
              value: sign(aspect.type),
              note: `${aspect.orb.toFixed(1)}°`,
            })),
        },
      ]
    : [];

  const excerpt = row?.natal_reading
    ? interpretationExcerpt(row.natal_reading)
    : undefined;

  return (
    <>
      <div className="member-head">
        <div>
          <p className="atlas-meta member-head__meta chart-meta">{meta}</p>
          <h1 className="atlas-page-title">
            {isPrimary || base.displayName === selectedName
              ? fillCopy(m.chartTitle, { name: selectedName })
              : selectedName}
          </h1>
        </div>
        <nav className="member-head__chips" aria-label={m.chartSwitcher}>
          {profiles.map((profile, index) => (
            <Link
              key={profile.id}
              href={`/account?view=charts&chart=${profile.id}`}
              className={`atlas-chip chart-switch${profile.id === selected.id ? " atlas-chip--active" : ""}`}
              aria-current={profile.id === selected.id ? "page" : undefined}
            >
              {nameFor(profile, index)}
            </Link>
          ))}
          <Link
            href={canAddChart ? "/#chart" : "/membership"}
            className="atlas-chip chart-switch chart-switch--add"
          >
            {canAddChart ? m.addChart : m.addChartAtlas}
          </Link>
        </nav>
      </div>

      {bigThree.length > 0 && (
        <ul className="chart-big-three" aria-label={m.bigThree}>
          {bigThree.map((item) => (
            <li className="chart-big" key={item.key}>
              <span className="chart-big__glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <div>
                <p className="chart-big__label">{item.label}</p>
                <p className="chart-big__sign">{sign(item.placement!.sign)}</p>
                <p className="chart-big__note">
                  {placementNote(item.placement)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {chart ? (
        <div className="chart-main">
          <div className="chart-wheel-card">
            <NatalChartWheel chart={chart} details={false} />
          </div>
          <ChartDataTabs tabs={tabs} label={m.chartData} />
        </div>
      ) : (
        <p className="member-error" role="alert">
          {accountCopy.reportUnavailable}
        </p>
      )}

      <article
        className="atlas-card chart-interpretation"
        aria-labelledby="chart-interpretation-title"
      >
        <div>
          <p className="atlas-kicker">{m.interpretationKicker}</p>
          <h2
            id="chart-interpretation-title"
            className="chart-interpretation__title"
          >
            {excerpt?.heading ?? m.interpretationFallbackTitle}
          </h2>
          <div className="member-actions">
            <a
              className="atlas-button"
              href={`/api/birth-profiles/${selected.id}/pdf`}
              download
            >
              {m.downloadPdf}
            </a>
            {excerpt && (
              <Link
                className="atlas-button-ghost"
                href={`/account/birth-profiles/${selected.id}`}
              >
                {m.readFullInterpretation}
              </Link>
            )}
          </div>
        </div>
        <div className="chart-interpretation__body">
          {excerpt?.paragraphs.length ? (
            excerpt.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))
          ) : (
            <p>{m.noInterpretation}</p>
          )}
        </div>
      </article>

      <section className="chart-manage" aria-labelledby="chart-manage-title">
        <h2 id="chart-manage-title" className="member-subtitle">
          {m.manageCharts}
        </h2>
        <p className="member-note">{m.chartPrivacy}</p>
        <BirthProfileList initialProfiles={base.birthProfiles} />
      </section>
    </>
  );
}
