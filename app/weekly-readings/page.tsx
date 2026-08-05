import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Weekly Astrology Readings",
  description:
    "Follow the week’s planetary transits as they meet your natal chart, with personal themes for timing, attention, relationships, work, and possibility.",
  path: "/weekly-readings",
  keywords: ["weekly astrology", "weekly horoscope", "weekly transits"],
});

export default function WeeklyReadingsPage() {
  return (
    <main className="page-shell weekly-offer">
      <header>
        <p className="eyebrow">The celestial rhythm</p>
        <h1>Your natal chart, alive in the week ahead.</h1>
        <p>
          Each weekly edition follows the moving planets as they meet your birth
          chart, turning the coming seven days into a personal map of timing,
          attention and possibility.
        </p>
      </header>
      <div className="weekly-offer__grid">
        <section>
          <h2>Every week in your atlas</h2>
          <ul>
            <li>Your most important natal transits</li>
            <li>Seven-day timing windows</li>
            <li>Work, relationship and inner-life currents</li>
            <li>A weekly focus and reflection question</li>
            <li>Evidence linked to your natal chart</li>
            <li>All saved privately in My Celestial Atlas</li>
          </ul>
          <Link href="/samples/weekly-reading" className="button-quiet">
            Read a sample edition
          </Link>
        </section>
        <aside>
          <p className="section-kicker">Subscription opening soon</p>
          <h2>Weekly Celestial Atlas</h2>
          <p>Monthly and annual membership options are being prepared.</p>
          <Link href="/membership" className="button-primary">
            Compare memberships
          </Link>
          <small>
            Members will be the first invited when subscriptions open.
          </small>
        </aside>
      </div>
    </main>
  );
}
