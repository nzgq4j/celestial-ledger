import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { NatalChartWheel } from "@/components/NatalChartWheel";
import { createClient } from "@/lib/supabase/server";
import type { NatalChart } from "@/lib/types";
import { NatalInterpretation } from "@/components/NatalInterpretation";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private natal chart — Celestial Atlas",
  robots: { index: false, follow: false, nocache: true },
};

const idSchema = z.string().uuid();

export default async function BirthProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("birth_profiles")
    .select(
      "id,label,display_name,expires_at,chart,natal_reading,natal_reading_model_version,natal_reading_prompt_version,natal_reading_generated_at",
    )
    .eq("id", parsedId.data)
    .maybeSingle();
  if (!profile?.chart) notFound();

  const chart = profile.chart as unknown as NatalChart;
  return (
    <main className="page-shell private-report">
      <header className="report-viewer-heading">
        <p className="eyebrow">Private natal chart</p>
        <h1>{profile.label}</h1>
        <p>{profile.display_name}</p>
        <small>
          Stored privately until{" "}
          {new Date(profile.expires_at).toLocaleDateString("en-GB")}.
        </small>
      </header>
      <NatalChartWheel chart={chart} />
      {profile.natal_reading && (
        <section className="panel p-5 mt-6">
          <p className="eyebrow">Saved natal reading</p>
          <div className="prose mt-4">
            <NatalInterpretation text={profile.natal_reading} />
          </div>
          {profile.natal_reading_generated_at && (
            <small>
              Generated{" "}
              {new Date(profile.natal_reading_generated_at).toLocaleDateString(
                "en-GB",
              )}
            </small>
          )}
        </section>
      )}
      <div className="mt-6">
        <Link className="button-quiet" href="/account">
          Return to My Celestial Atlas
        </Link>
      </div>
    </main>
  );
}
