import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { runNextReportJob } from "@/app/api/internal/report-worker/route";
import { createClient } from "@/lib/supabase/server";
import {
  careerReportSchema,
  type CareerEvidenceBundle,
} from "@/lib/reports/career";
import { recoveryReportSchema } from "@/lib/reports/recovery";
import { ReportGenerationProgress } from "@/components/ReportGenerationProgress";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = {
  title: "Private report — Celestial Atlas",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/auth/login");
  const [{ data: report }, { data: evidenceRow }] = await Promise.all([
    supabase
      .from("reports")
      .select(
        "id,report_type,status,output,failure_code,attempts,created_at,completed_at,expires_at",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("report_evidence")
      .select("evidence")
      .eq("report_id", id)
      .maybeSingle(),
  ]);
  if (!report) notFound();
  if (report.status === "queued")
    after(async () => {
      const result = await runNextReportJob();
      if (!result.ok)
        console.error(
          JSON.stringify({
            level: "error",
            message: "Queued report page worker invocation failed",
            status: result.status,
          }),
        );
    });
  if (report.status !== "completed")
    return (
      <main className="page-shell private-report">
        <ReportGenerationProgress
          reportId={report.id}
          initialStatus={report.status as "queued" | "generating" | "failed"}
        />
        <Link className="button-quiet" href="/account">
          Return to library
        </Link>
      </main>
    );
  const isRecovery = report.report_type === "recovery_reflection";
  const output = isRecovery
    ? recoveryReportSchema.safeParse(report.output)
    : careerReportSchema.safeParse(report.output);
  const evidence = evidenceRow?.evidence as unknown as
    CareerEvidenceBundle | undefined;
  if (!output.success || !evidence)
    return (
      <main className="page-shell">
        <h1>Report unavailable</h1>
      </main>
    );
  const evidenceById = new Map(evidence.items.map((item) => [item.id, item]));
  return (
    <main className="page-shell private-report">
      <header className="report-viewer-heading">
        <p className="eyebrow">
          {isRecovery
            ? "Recovery Reflection · private edition"
            : "Career and Purpose · private edition"}
        </p>
        <h1>{output.data.title}</h1>
        <p>{output.data.introduction}</p>
        {evidence.uncertainty.map((note) => (
          <aside key={note}>{note}</aside>
        ))}
      </header>
      <div className="report-viewer-grid">
        <article className="report-narrative">
          {output.data.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.narrative}</p>
              {!!section.reflectionQuestions.length && (
                <div className="reflection-prompts">
                  <h3>Questions to carry forward</h3>
                  <ul>
                    {section.reflectionQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
              <details>
                <summary>Evidence for this section</summary>
                <ul>
                  {section.evidenceIds.map((evidenceId) => (
                    <li key={evidenceId}>
                      <code>{evidenceId}</code> —{" "}
                      {evidenceById.get(evidenceId)?.label}
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          ))}
          <footer>
            <p>{output.data.closing}</p>
            {!isRecovery && "disclaimer" in output.data && (
              <small>{output.data.disclaimer}</small>
            )}
          </footer>
        </article>
        <aside className="evidence-map">
          <p className="section-kicker">Evidence constellation</p>
          <h2>Chart factors used</h2>
          {evidence.items
            .filter((item) =>
              output.data.sections.some((section) =>
                section.evidenceIds.includes(item.id),
              ),
            )
            .map((item) => (
              <div
                key={item.id}
                className={`evidence-node evidence-node--${item.kind}`}
              >
                <span>{item.kind}</span>
                <strong>{item.label}</strong>
                <code>{item.id}</code>
              </div>
            ))}
        </aside>
      </div>
    </main>
  );
}
