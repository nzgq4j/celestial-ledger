import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { NatalChartWheel } from "@/components/NatalChartWheel";
import { createClient } from "@/lib/supabase/server";
import type { NatalChart } from "@/lib/types";
import { NatalInterpretation } from "@/components/NatalInterpretation";
import { getServerTranslationPack } from "@/lib/i18n/server";
import { memberCopy, fillCopy } from "@/lib/account/member-copy";
import "@/app/styles/atlas-member.css";

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
  const pack = await getServerTranslationPack();
  const m = memberCopy[pack.tag];
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(pack.tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return (
    <main className="atlas-shell member-doc">
      <div className="member-doc-actions">
        <Link
          className="member-doc-actions__back"
          href={`/account?view=charts&chart=${profile.id}`}
        >
          ← {m.backToChart}
        </Link>
        <a
          className="atlas-button atlas-button--sm"
          href={`/api/birth-profiles/${profile.id}/pdf`}
          download
        >
          {m.downloadPdf}
        </a>
      </div>
      <header className="report-viewer-heading">
        <p className="atlas-kicker">{pack.messages.account.natalChart}</p>
        <h1>{profile.label}</h1>
        <p className="atlas-meta">
          {profile.display_name} · {pack.messages.account.heldUntil}{" "}
          {formatDate(profile.expires_at)}
        </p>
      </header>
      <figure className="chart-wheel-card" aria-label={m.wheelLabel}>
        <NatalChartWheel chart={chart} />
      </figure>
      {profile.natal_reading ? (
        <section
          className="natal-reading-full"
          aria-labelledby="natal-reading-title"
        >
          <p className="atlas-kicker">{m.interpretationKicker}</p>
          <h2 id="natal-reading-title" className="member-sr">
            {m.interpretationFallbackTitle}
          </h2>
          <NatalInterpretation text={profile.natal_reading} />
          {profile.natal_reading_generated_at && (
            <p className="member-note">
              {fillCopy(m.savedOn, {
                date: formatDate(profile.natal_reading_generated_at),
              })}
            </p>
          )}
        </section>
      ) : (
        <p className="member-note">{m.noInterpretation}</p>
      )}
    </main>
  );
}
