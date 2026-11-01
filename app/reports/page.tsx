import Link from "next/link";
import "@/app/styles/atlas-member.css";
import { createPageMetadata } from "@/lib/seo";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { memberCopy } from "@/lib/account/member-copy";
import {
  loadMemberBase,
  loadPublicReportPrices,
  loadReportContext,
} from "@/lib/account/member-data";
import { ReportOffers } from "@/components/account/ReportOffers";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Personal Astrology Reports",
  description:
    "Private astrology reports for vocation and renewal, generated from your natal chart with every statement linked to the placements behind it.",
  path: "/reports",
  keywords: ["personal astrology report", "career astrology", "natal report"],
});

/**
 * Reports catalogue. Visitors see the two reports with their current prices
 * (from `report_prices`, never hard-coded) and samples; signed-in members see
 * the live state of each report and the matching action.
 */
export default async function ReportsPage() {
  const [pack, base] = await Promise.all([
    getServerTranslationPack(),
    loadMemberBase().catch(() => null),
  ]);
  const m = memberCopy[pack.tag];
  const reportContext = base ? await loadReportContext(base) : undefined;
  const prices = reportContext
    ? reportContext.reportPrices
    : await loadPublicReportPrices();

  return (
    <main className="atlas-shell member-page">
      <header className="member-head member-head--stacked">
        <div>
          <p className="atlas-kicker">{m.reportsKicker}</p>
          <h1 className="atlas-page-title">{m.reportsTitle}</h1>
          <p className="reports-intro">{m.reportsIntro}</p>
        </div>
      </header>
      <ReportOffers
        pack={pack}
        prices={prices}
        member={
          base && reportContext
            ? {
                states: reportContext.reportStates,
                primaryReportType: reportContext.primaryReportType,
                planKey: base.planKey,
                profiles: base.activeProfiles.map(({ id, label }) => ({
                  id,
                  label,
                })),
                reportLocale: base.reportLocale ?? pack.tag,
                checkoutEnabled: base.commerce.checkout,
                availableReportCredits: reportContext.availableReportCredits,
              }
            : undefined
        }
      />
      <footer className="reports-footer">
        <p className="member-note">{m.reportsPrivacy}</p>
        {base ? (
          <Link href="/account?view=library" className="atlas-button-ghost">
            {m.libraryTitle} →
          </Link>
        ) : (
          <Link href="/membership" className="atlas-button-ghost">
            {m.comparePlans}
          </Link>
        )}
      </footer>
    </main>
  );
}
