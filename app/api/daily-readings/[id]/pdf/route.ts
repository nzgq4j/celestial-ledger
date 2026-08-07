import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  dailyReadingAnalysisSchema,
  dailyReadingContentSchema,
  dailyEvidenceSchema,
} from "@/lib/daily-readings/domain";
import { buildDailyReadingPdf } from "@/lib/daily-readings/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = z
    .string()
    .uuid()
    .safeParse((await params).id);
  if (!id.success)
    return Response.json({ error: "Invalid daily reading." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub)
    return Response.json({ error: "Sign in required." }, { status: 401 });
  const { data: reading } = await supabase
    .from("daily_readings")
    .select("id,birth_profile_id,analysis,content,evidence,generated_at")
    .eq("id", id.data)
    .maybeSingle();
  if (!reading)
    return Response.json(
      { error: "Daily reading unavailable." },
      { status: 404 },
    );
  const [content, analysis, evidence] = [
    dailyReadingContentSchema.safeParse(reading.content),
    dailyReadingAnalysisSchema.safeParse(reading.analysis),
    dailyEvidenceSchema.array().safeParse(reading.evidence),
  ];
  if (!content.success || !analysis.success || !evidence.success)
    return Response.json(
      { error: "Daily reading unavailable." },
      { status: 422 },
    );
  const bytes = await buildDailyReadingPdf({
    content: content.data,
    analysis: analysis.data,
    evidence: evidence.data,
    generatedAt: new Date(reading.generated_at).toLocaleDateString(
      content.data.locale,
    ),
  });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="daily-reading-${reading.id.slice(0, 8)}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
