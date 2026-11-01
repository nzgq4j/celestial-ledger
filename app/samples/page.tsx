import Link from "next/link";
import "@/app/styles/atlas-member.css";
import { createPageMetadata } from "@/lib/seo";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { sampleLibraryCopy } from "@/lib/sample-reports/library-copy";

const folioMarkers = ["I", "II", "III", "IV", "V"];

export async function generateMetadata() {
  const pack = await getServerTranslationPack();
  const copy = sampleLibraryCopy[pack.tag];
  return createPageMetadata({
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    path: "/samples",
    keywords: ["sample astrology report", "sample natal reading"],
  });
}

export default async function SamplesPage() {
  const pack = await getServerTranslationPack();
  const copy = sampleLibraryCopy[pack.tag];

  return (
    <main
      className="atlas-shell member-doc member-doc--wide sample-library"
      lang={pack.tag}
    >
      <header className="sample-library__hero">
        <p className="atlas-kicker">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.introduction}</p>
      </header>
      <section className="sample-editions">
        {copy.editions.map((edition, index) => (
          <article key={edition.href}>
            <span className="sample-editions__folio" aria-hidden="true">
              {folioMarkers[index]}
            </span>
            <div className="sample-editions__content">
              <p className="atlas-kicker">{edition.label}</p>
              <h2>{edition.title}</h2>
              <p className="sample-editions__description">
                {edition.description}
              </p>
              <h3>{edition.contentsHeading}</h3>
              <ul>
                {edition.contents.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link
                href={edition.href}
                className="sample-editions__cta atlas-button-ghost"
              >
                {edition.action} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
