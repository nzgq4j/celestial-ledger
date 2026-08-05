import Link from "next/link";
import { sampleChart, sampleIdentity } from "@/lib/samples";
import { buildDailyReadingAnalysis } from "@/lib/daily-readings/calculation";
import { buildDailyReadingContent } from "@/lib/daily-readings/content";
import { DailyReadingView } from "@/components/DailyReadingView";

export const metadata = {
  title: "Sample daily astrological reading — Celestial Atlas",
  description:
    "Read a complete evidence-linked sample of the registered-user Celestial Atlas daily reading.",
};

export default async function SampleDailyReadingPage() {
  const natalChart = await sampleChart();
  const analysis = buildDailyReadingAnalysis({
    natalChart,
    readingDate: "2026-08-05",
    observationTimeZone: natalChart.input.place.timeZone,
    locale: "en-GB",
    calculatedAtUtc: "2026-08-05T08:00:00.000Z",
  });
  const content = buildDailyReadingContent(
    analysis,
    "eb437f1b-5e12-43be-a123-060ec2bf3ce1",
  );
  return (
    <main className="page-shell sample-daily-reading">
      <DailyReadingView
        content={content}
        evidence={analysis.evidence}
        profileLabel={sampleIdentity.name}
        sample
      />
      <aside className="sample-daily-reading__cta">
        <p className="section-kicker">Your sky, your day</p>
        <h2>Registered users receive the personal edition.</h2>
        <p>
          Save your natal chart, then open a daily brief built from the transits
          meeting your own planetary positions.
        </p>
        <Link href="/auth/login" className="button-primary">
          Sign in or create an account
        </Link>
      </aside>
    </main>
  );
}
