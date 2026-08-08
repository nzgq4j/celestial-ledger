import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  weeklyReadingAnalysisSchema,
  weeklyReadingContentSchema,
} from "@/lib/weekly-readings/domain";
import { WeeklyReadingView } from "@/components/WeeklyReadingView";
import { WeeklyReadingActions } from "@/components/WeeklyReadingActions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Weekly reading — Celestial Atlas",
  robots: { index: false, follow: false, nocache: true },
};

export default async function WeeklyReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success) notFound();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string") redirect("/auth/login");
  const { data } = await supabase
    .from("weekly_readings")
    .select("id,birth_profile_id,analysis,content")
    .eq("id", id.data)
    .maybeSingle();
  if (!data) notFound();
  const [{ data: profile }, analysis, content] = await Promise.all([
    supabase
      .from("birth_profiles")
      .select("label")
      .eq("id", data.birth_profile_id)
      .maybeSingle(),
    Promise.resolve(weeklyReadingAnalysisSchema.safeParse(data.analysis)),
    Promise.resolve(weeklyReadingContentSchema.safeParse(data.content)),
  ]);
  if (!analysis.success || !content.success) notFound();
  return (
    <main className="page-shell private-report daily-reading-page">
      <WeeklyReadingActions readingId={data.id} />
      <WeeklyReadingView
        content={content.data}
        analysis={analysis.data}
        profileLabel={profile?.label ?? "Birth chart"}
      />
    </main>
  );
}
