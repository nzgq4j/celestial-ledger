import Link from "next/link";
import "@/app/styles/atlas-member.css";
import { createPageMetadata } from "@/lib/seo";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { memberCopy, fillCopy } from "@/lib/account/member-copy";
import { ATLAS_PRICES, ATLAS_TRIAL_DAYS } from "@/lib/membership/plans";

export const metadata = createPageMetadata({
  title: "Weekly Astrology Readings",
  description:
    "Follow the week’s planetary transits as they meet your natal chart, with personal themes for timing, attention, relationships, work, and possibility.",
  path: "/weekly-readings",
  keywords: ["weekly astrology", "weekly horoscope", "weekly transits"],
});

export default async function WeeklyReadingsPage() {
  const pack = await getServerTranslationPack();
  const m = memberCopy[pack.tag];
  const items = [
    m.weeklyItem1,
    m.weeklyItem2,
    m.weeklyItem3,
    m.weeklyItem4,
    m.weeklyItem5,
  ];
  return (
    <main className="atlas-shell member-page weekly-offer-page">
      <header className="member-head member-head--stacked">
        <div>
          <p className="atlas-kicker">{m.weeklyOfferKicker}</p>
          <h1 className="atlas-page-title">{m.weeklyOfferTitle}</h1>
          <p className="member-lede">{m.weeklyOfferIntro}</p>
        </div>
      </header>
      <div className="billing-grid">
        <section className="atlas-card" aria-labelledby="weekly-offer-includes">
          <h2 id="weekly-offer-includes" className="member-subtitle">
            {m.weeklyOfferIncludes}
          </h2>
          <ul className="member-ticks">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="member-actions">
            <Link href="/samples/weekly-reading" className="atlas-button-ghost">
              {m.readSampleEdition}
            </Link>
          </div>
        </section>
        <aside
          className="atlas-card atlas-card--feature"
          aria-labelledby="weekly-offer-atlas"
        >
          <p className="atlas-kicker">Atlas</p>
          <h2 id="weekly-offer-atlas" className="billing-plan__name">
            {m.weeklyOfferAtlasTitle}
          </h2>
          <p className="billing-plan__summary">
            {fillCopy(m.weeklyOfferAtlasCopy, {
              monthly: ATLAS_PRICES.month.display,
              yearly: ATLAS_PRICES.year.display,
              days: ATLAS_TRIAL_DAYS,
            })}
          </p>
          <div className="member-actions">
            <Link href="/membership" className="atlas-button">
              {fillCopy(m.startTrial, { days: ATLAS_TRIAL_DAYS })}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
