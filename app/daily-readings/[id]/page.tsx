import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  dailyReadingAnalysisSchema,
  dailyReadingContentSchema,
  dailyEvidenceSchema,
} from "@/lib/daily-readings/domain";
import { DailyReadingView } from "@/components/DailyReadingView";
import { DailyReadingActions } from "@/components/DailyReadingActions";
import { SocialShareLinks } from "@/components/SocialShareLinks";
import { SITE_URL } from "@/lib/seo";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Daily reading — Celestial Atlas",
  robots: { index: false, follow: false, nocache: true },
};

export default async function DailyReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parsedId = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!parsedId.success) notFound();
  const id = parsedId.data;
  const pack = await getServerTranslationPack();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string") redirect("/auth/login");
  const { data: reading, error } = await supabase
    .from("daily_readings")
    .select("id,birth_profile_id,analysis,content,evidence")
    .eq("id", id)
    .single();
  if (error || !reading) notFound();
  const { data: profile } = await supabase
    .from("birth_profiles")
    .select("label")
    .eq("id", reading.birth_profile_id)
    .single();
  const content = dailyReadingContentSchema.safeParse(reading.content);
  const analysis = dailyReadingAnalysisSchema.safeParse(reading.analysis);
  const evidence = dailyEvidenceSchema.array().safeParse(reading.evidence);
  if (!analysis.success || !content.success || !evidence.success) notFound();

  return (
    <main className="page-shell private-report daily-reading-page">
      <DailyReadingActions readingId={reading.id} />
      <DailyReadingView
        content={content.data}
        analysis={analysis.data}
        evidence={evidence.data}
        profileLabel={profile?.label ?? "Birth chart"}
      />
      <SocialShareLinks
        url={`${SITE_URL}/daily-readings/${reading.id}`}
        sign="DailyReading"
        title={`Celestial Atlas daily reading: ${content.data.header.headline}`}
        description={content.data.bottomLineUpFront.overview.narrative}
        landscapeImageUrl={`${SITE_URL}/opengraph-image`}
        portraitImageUrl={`${SITE_URL}/opengraph-image`}
        heading={pack.messages.horoscopes.shareReading}
        copyLabel={pack.messages.horoscopes.copyLink}
        copiedLabel={pack.messages.horoscopes.linkCopied}
      />
    </main>
  );
}
