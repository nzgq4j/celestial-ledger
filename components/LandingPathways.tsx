"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { ATLAS_PRICES, PLAN_ALLOWANCES } from "@/lib/membership/plans";

const TEXT = "︎";

/** "Then, every day": the three daily rituals and their plan availability. */
export function LandingPathways({ previewHref }: { previewHref: string }) {
  const { pack } = useLocale();
  const copy = pack.messages.home;
  const rituals = [
    {
      glyph: "☉",
      when: copy.ritualReadingWhen,
      title: copy.ritualReadingTitle,
      text: copy.ritualReadingCopy,
      plan: copy.ritualReadingPlan,
    },
    {
      glyph: "✦",
      when: copy.ritualTarotWhen,
      title: copy.ritualTarotTitle,
      text: copy.ritualTarotCopy,
      plan: copy.ritualTarotPlan,
    },
    {
      glyph: "☽",
      when: copy.ritualWeeklyWhen,
      title: copy.ritualWeeklyTitle,
      text: copy.ritualWeeklyCopy,
      plan: copy.ritualWeeklyPlan,
    },
  ];
  return (
    <section className="home-section" aria-labelledby="home-rituals-title">
      <header className="home-section__header">
        <div>
          <p className="atlas-kicker">{copy.ritualsKicker}</p>
          <h2 id="home-rituals-title" className="home-section__title">
            {copy.ritualsTitle}
          </h2>
        </div>
        <Link className="atlas-button-ghost" href={previewHref}>
          {copy.ritualsPreview} <span aria-hidden="true">→</span>
        </Link>
      </header>
      <div className="home-rituals">
        {rituals.map((ritual) => (
          <article className="home-ritual" key={ritual.title}>
            <div className="home-ritual__top">
              <span className="home-ritual__glyph" aria-hidden="true">
                {ritual.glyph + TEXT}
              </span>
              <span className="home-ritual__when">{ritual.when}</span>
            </div>
            <h3>{ritual.title}</h3>
            <p>{ritual.text}</p>
            <span className="home-ritual__plan">{ritual.plan}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

/** "Free forever. Deeper when you want it." Prices come from the catalogue. */
export function LandingPlanStrip() {
  const { pack } = useLocale();
  const copy = pack.messages.home;
  const rows = [
    {
      name: copy.planFree,
      line: copy.planFreeLine.replace(
        "{readings}",
        String(PLAN_ALLOWANCES.free.personalReadingsPerWeek),
      ),
      price: "$0",
      cadence: "",
    },
    {
      name: copy.planAtlas,
      line: copy.planAtlasLine.replace(
        "{charts}",
        String(PLAN_ALLOWANCES.atlas.savedCharts),
      ),
      price: ATLAS_PRICES.month.display,
      cadence: copy.perMonth,
    },
  ];
  return (
    <section className="home-section" aria-labelledby="home-plans-title">
      <div className="home-plans">
        <div>
          <h2 id="home-plans-title" className="home-plans__title">
            {copy.plansTitleFirst} <em>{copy.plansTitleSecond}</em>
          </h2>
          <p>{copy.plansCopy}</p>
        </div>
        <div className="home-plans__rows">
          <ul>
            {rows.map((row) => (
              <li className="home-plans__row" key={row.name}>
                <strong>{row.name}</strong>
                <span>{row.line}</span>
                <span className="home-plans__price">
                  {row.price}
                  {row.cadence && <small> {row.cadence}</small>}
                </span>
              </li>
            ))}
          </ul>
          <Link className="atlas-link home-plans__compare" href="/membership">
            {copy.plansCompare} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
