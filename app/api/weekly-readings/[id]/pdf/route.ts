import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  weeklyReadingAnalysisSchema,
  weeklyReadingContentSchema,
} from "@/lib/weekly-readings/domain";
import { buildWeeklyReadingPdf } from "@/lib/weekly-readings/pdf";

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
    return Response.json({ error: "Invalid weekly reading." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (typeof auth?.claims?.sub !== "string")
    return Response.json({ error: "Sign in required." }, { status: 401 });
  const { data } = await supabase
    .from("weekly_readings")
    .select("id,analysis,content,generated_at")
    .eq("id", id.data)
    .eq("user_id", auth.claims.sub)
    .maybeSingle();
  if (!data)
    return Response.json(
      { error: "Weekly reading unavailable." },
      { status: 404 },
    );
  const analysis = weeklyReadingAnalysisSchema.safeParse(data.analysis);
  const content = weeklyReadingContentSchema.safeParse(data.content);
  if (!analysis.success || !content.success)
    return Response.json(
      { error: "Weekly reading unavailable." },
      { status: 422 },
    );
  const bytes = await buildWeeklyReadingPdf({
    content: content.data,
    analysis: analysis.data,
    generatedAt: new Date(data.generated_at).toLocaleDateString(
      content.data.locale,
    ),
  });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="weekly-reading-${data.id.slice(0, 8)}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
