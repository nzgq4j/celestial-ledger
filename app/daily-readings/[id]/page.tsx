import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  dailyReadingContentSchema,
  dailyEvidenceSchema,
} from "@/lib/daily-readings/domain";
import { DailyReadingView } from "@/components/DailyReadingView";
import { DailyReadingActions } from "@/components/DailyReadingActions";

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
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string") redirect("/auth/login");
  const { data: reading, error } = await supabase
    .from("daily_readings")
    .select("id,birth_profile_id,content,evidence")
    .eq("id", id)
    .single();
  if (error || !reading) notFound();
  const { data: profile } = await supabase
    .from("birth_profiles")
    .select("label")
    .eq("id", reading.birth_profile_id)
    .single();
  const content = dailyReadingContentSchema.safeParse(reading.content);
  const evidence = dailyEvidenceSchema.array().safeParse(reading.evidence);
  if (!content.success || !evidence.success) notFound();

  return (
    <main className="page-shell private-report daily-reading-page">
      <DailyReadingActions readingId={reading.id} />
      <DailyReadingView
        content={content.data}
        evidence={evidence.data}
        profileLabel={profile?.label ?? "Birth chart"}
      />
    </main>
  );
}
