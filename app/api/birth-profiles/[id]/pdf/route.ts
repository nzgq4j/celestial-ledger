import { z } from "zod";
import { buildNatalChartPdf } from "@/lib/natal-chart-pdf";
import { createClient } from "@/lib/supabase/server";
import type { NatalChart } from "@/lib/types";

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
    return Response.json({ error: "Invalid natal chart." }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub)
    return Response.json({ error: "Sign in required." }, { status: 401 });

  const { data: profile } = await supabase
    .from("birth_profiles")
    .select(
      "id,label,display_name,chart,natal_reading,natal_reading_generated_at",
    )
    .eq("id", id.data)
    .maybeSingle();
  if (!profile?.chart)
    return Response.json(
      { error: "Natal chart unavailable." },
      { status: 404 },
    );

  const bytes = await buildNatalChartPdf({
    title: profile.label,
    displayName: profile.display_name,
    chart: profile.chart as unknown as NatalChart,
    interpretation: profile.natal_reading,
    generatedAt: profile.natal_reading_generated_at
      ? new Date(profile.natal_reading_generated_at).toLocaleDateString("en-GB")
      : null,
  });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="natal-chart-${profile.id.slice(0, 8)}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
