import { notFound } from "next/navigation";
import "@/app/styles/atlas-member.css";
import { TodayLayout } from "@/components/account/TodayLayout";
import { TarotSymbolicCardFace } from "@/components/TarotSymbolicCardFace";
import { isDemoMode } from "@/lib/supabase/config";

/**
 * Preview of the Today layout with sample data, for visual review without a
 * signed-in session: available in local development and in demo mode (Vercel
 * preview deployments), and 404 on production.
 */
export default function TodayPreview() {
  if (process.env.NODE_ENV === "production" && !isDemoMode()) notFound();
  return (
    <main className="atlas-shell member-page">
      <TodayLayout
        heading={
          <div className="member-head">
            <div>
              <p className="today2-eyebrow">Tuesday, 24 November</p>
              <h1 className="numbers-h1">Good evening, Amelia.</h1>
            </div>
          </div>
        }
        insight={{
          title: "Personal Day 8 · Moon in Gemini",
          body: "Handle money and business. Make the confident ask.",
          meta: "Celestial Atlas",
          now: "now",
          dismiss: "Dismiss",
        }}
        bigThree={{
          label: "Your Big Three",
          items: [
            { key: "sun", label: "Sun", glyph: "♌︎", sign: "Leo" },
            { key: "moon", label: "Moon", glyph: "♒︎", sign: "Aquarius" },
            { key: "asc", label: "Rising", glyph: "♌︎", sign: "Leo" },
          ],
        }}
        feature={
          <article className="atlas-card atlas-card--feature today-feature">
            <p className="atlas-kicker">Your personal reading</p>
            <h2 className="atlas-section-title today-feature__title">
              Today’s reading hasn’t been written yet.
            </h2>
            <p className="today-feature__body">
              We map today’s transits onto your saved chart and write a reading
              in three movements: morning, noon and evening.
            </p>
            <div className="member-actions">
              <button type="button" className="atlas-button">
                Generate today’s reading
              </button>
            </div>
          </article>
        }
        horoscope={{
          kicker: "Your day · Leo",
          overview:
            "Your energy is high — channel it into one clear goal. Leo works best with warm, expressive, generous energy — use it.",
          loveLabel: "Love",
          love: "Tension at home eases if you lead with curiosity instead of being right.",
          href: "/horoscopes/leo",
          linkLabel: "Full horoscope",
        }}
        moon={{
          kicker: "Moon tonight",
          phase: "Full",
          detail: "100% lit · in Gemini",
          text: "Peak emotion and visibility. Things come to light — celebrate or release.",
          illuminated: 0.98,
          waxing: true,
          href: "/clock",
        }}
        numbers={{
          kicker: "Your numbers today",
          cells: [
            { label: "Year", value: 9 },
            { label: "Month", value: 2 },
            { label: "Day", value: 8 },
          ],
          text: "Handle money and business. Make the confident ask.",
          href: "/numbers",
          linkLabel: "All your numbers",
        }}
        card={{
          kicker: "Card of the day",
          title: "The Magician",
          orientation: "Upright",
          meaning:
            "Resourcefulness and follow-through can bring an idea into form; take stock of the tools already within reach.",
          href: "/tarot",
          linkLabel: "Full tarot reading",
          face: (
            <TarotSymbolicCardFace
              arcana="major"
              suit={null}
              number={1}
              name="The Magician"
            />
          ),
        }}
        lower={
          <a
            href="/account?view=library"
            className="member-link-card today-teaser today2-cta"
          >
            <span className="atlas-kicker">Reports</span>
            <span className="today-teaser__title">Your deeper atlas</span>
            <span className="today-teaser__link">Explore reports →</span>
          </a>
        }
      />
    </main>
  );
}
