import "@/app/styles/atlas-member.css";
import { NumbersExplorer } from "@/components/NumbersExplorer";
import { loadMemberBase } from "@/lib/account/member-data";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { numerologyCopy } from "@/lib/numerology/copy";
import { numbersPageCopy } from "@/lib/numerology/page-copy";
import { createPageMetadata } from "@/lib/seo";
import { isoDateInTimeZone } from "@/lib/weekly-readings/calculation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const pack = await getServerTranslationPack();
  const copy = numbersPageCopy[pack.tag];
  return createPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: "/numbers",
    keywords: ["life path number", "numerology", "personal year"],
  });
}

export default async function NumbersPage() {
  const [pack, base] = await Promise.all([
    getServerTranslationPack(),
    loadMemberBase().catch(() => null),
  ]);
  const copy = numbersPageCopy[pack.tag];
  const primary = base?.primaryProfile;
  return (
    <main className="atlas-shell member-page">
      <div className="numbers-head">
        <p className="today2-eyebrow">{copy.eyebrow}</p>
        <h1 className="numbers-h1">{copy.title}</h1>
      </div>
      <NumbersExplorer
        copy={copy}
        numbers={numerologyCopy[pack.tag]}
        birthDate={primary?.birth_date ?? undefined}
        localDate={
          primary ? isoDateInTimeZone(new Date(), primary.time_zone) : undefined
        }
        chartName={
          primary
            ? (primary.label ?? primary.display_name ?? undefined)
            : undefined
        }
        locale={pack.tag}
      />
    </main>
  );
}
