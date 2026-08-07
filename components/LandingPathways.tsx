"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { membershipCopy } from "@/lib/membership/content";

const routes = ["/horoscopes", "/weekly-readings", "/reports"] as const;
const symbols = ["☉", "☽", "✦"] as const;

export function LandingPathways() {
  const { locale } = useLocale();
  const copy = membershipCopy[locale].landing;
  const titleLines = copy.title.split(/(?<=\.)\s+/);
  return (
    <section
      className="landing-pathways"
      aria-labelledby="landing-pathways-title"
    >
      <header>
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h2 id="landing-pathways-title">
            {titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
        </div>
        <p>{copy.introduction}</p>
      </header>
      <div className="landing-pathways__routes">
        {copy.routes.map((route, index) => (
          <article key={route.title}>
            <div className="landing-pathways__symbol" aria-hidden="true">
              <span>{symbols[index]}</span>
              <i />
            </div>
            <p className="landing-pathways__label">{route.label}</p>
            <h3>{route.title}</h3>
            <p>{route.description}</p>
            <Link href={routes[index]} className="button-quiet">
              {route.action}
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
      <footer>
        <p>{copy.membershipNote}</p>
        <Link href="/membership" className="button-primary">
          {copy.membershipAction}
        </Link>
      </footer>
    </section>
  );
}
