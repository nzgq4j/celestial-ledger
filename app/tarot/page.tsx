import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TarotReadingExperience } from "@/components/TarotReadingExperience";
import { tarotReadingFlags } from "@/lib/commerce/flags";
import { effectivePlanKeyForUser } from "@/lib/entitlements/server";
import { isLocaleTag } from "@/lib/i18n/config";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { listActiveTarotDecksForPlan } from "@/lib/tarot/decks";
import { TAROT_READINGS } from "@/lib/tarot/readings";
import { localizeTarotReadings } from "@/lib/tarot/reading-locales";

export const dynamic = "force-dynamic";

type TarotPageProps = {
  searchParams: Promise<{ lang?: string; deck?: string }>;
};

export async function generateMetadata({
  searchParams,
}: TarotPageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  const pack = await getServerTranslationPack(
    lang && isLocaleTag(lang) ? lang : undefined,
  );
  return createPageMetadata({
    title: "Tarot Reading",
    description: pack.messages.tarot.pageIntroduction,
    path: "/tarot",
    keywords: ["symbolic tarot reading", "tarot reflection"],
  });
}

export default async function TarotPage({ searchParams }: TarotPageProps) {
  if (!tarotReadingFlags().enabled) notFound();

  const { lang, deck } = await searchParams;
  const pack = await getServerTranslationPack(
    lang && isLocaleTag(lang) ? lang : undefined,
  );
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const currentPlan = data.user
    ? await effectivePlanKeyForUser(data.user.id)
    : "free";
  const decks = await listActiveTarotDecksForPlan(currentPlan, pack.tag);
  const readings = localizeTarotReadings(TAROT_READINGS, pack.tag);

  return (
    <main className="atlas-shell tarot-page-atlas">
      <header>
        <p className="atlas-kicker">{pack.messages.tarot.pageEyebrow}</p>
        <h1 className="atlas-page-title">{pack.messages.tarot.pageTitle}</h1>
      </header>
      <TarotReadingExperience
        decks={[...decks]}
        readings={[...readings]}
        initialDeckId={deck}
        currentPlan={currentPlan}
        locale={pack.tag}
        copy={pack.messages.tarot}
      />
    </main>
  );
}
