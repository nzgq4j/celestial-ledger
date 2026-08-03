import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";
import { BirthProfileList } from "@/components/BirthProfileList";
import { CheckoutButton } from "@/components/CheckoutButton";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Account — Celestial Atlas",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AccountPage() {
  if (isDemoMode()) redirect("/auth/login");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/auth/login");

  const [
    { data: profile },
    { data: birthProfiles },
    { data: reports },
    { data: products },
    { data: entitlements },
  ] = await Promise.all([
    supabase.from("profiles").select("adult_confirmed_at, created_at").single(),
    supabase
      .from("birth_profiles")
      .select(
        "id, label, birth_date, display_name, time_unknown, expires_at, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("id, report_type, status, expires_at, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("report_type, name, description, unit_amount, currency")
      .order("unit_amount", { ascending: false }),
    supabase
      .from("entitlements")
      .select("id, report_type, status, granted_at")
      .order("granted_at", { ascending: false }),
  ]);

  return (
    <main className="page-shell private-library">
      <section className="library-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Private atlas index</p>
            <h1>Report library</h1>
          </div>
          <form action={signOut}>
            <button className="button-quiet">Sign out</button>
          </form>
        </div>
        <p className="mt-4 text-[#b9b2a3]">
          Adult confirmation:{" "}
          {profile?.adult_confirmed_at ? "recorded" : "not recorded"}
        </p>
      </section>
      <section className="library-section">
        <p className="section-kicker">Source material</p>
        <h2>Birth profiles</h2>
        <BirthProfileList initialProfiles={birthProfiles ?? []} />
      </section>
      <section className="library-section">
        <p className="section-kicker">Report collection</p>
        <h2>Available reports</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(products ?? [])
            .filter((product) => product.report_type === "career_purpose")
            .map((product) => (
              <article key={product.report_type} className="library-product">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="mt-2 text-sm text-[#b9b2a3]">
                  {product.description}
                </p>
                <p className="my-3 gold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: product.currency ?? "USD",
                  }).format((product.unit_amount ?? 0) / 100)}
                </p>
                <CheckoutButton reportType={product.report_type} />
              </article>
            ))}
        </div>
      </section>
      <section className="library-section">
        <p className="section-kicker">Purchased access</p>
        <h2>Entitlements</h2>
        <p className="mt-3 text-[#b9b2a3]">
          {entitlements?.length
            ? `${entitlements.length} purchased report entitlement(s).`
            : "No report entitlements yet."}
        </p>
        <div className="mt-5 grid gap-4">
          {(entitlements ?? [])
            .filter(
              (entitlement) =>
                entitlement.status === "unused" &&
                entitlement.report_type === "career_purpose",
            )
            .map((entitlement) => (
              <article className="library-product" key={entitlement.id}>
                <h3>Career and Purpose</h3>
                <p className="text-sm text-[#b9b2a3] mt-1">
                  Purchased and ready to generate.
                </p>
                <GenerateReportButton
                  entitlementId={entitlement.id}
                  profiles={(birthProfiles ?? []).map((profile) => ({
                    id: profile.id,
                    label: profile.label,
                  }))}
                />
              </article>
            ))}
        </div>
      </section>
      <section className="library-section">
        <p className="section-kicker">Your archive</p>
        <h2>Reports</h2>
        {reports?.length ? (
          <div className="report-library-list">
            {reports.map((report) => (
              <Link href={`/reports/${report.id}`} key={report.id}>
                <span>{report.report_type.replaceAll("_", " ")}</span>
                <strong>{report.status}</strong>
                <small>
                  {report.expires_at
                    ? `Available until ${new Date(report.expires_at).toLocaleDateString("en-GB")}`
                    : new Date(report.created_at).toLocaleDateString("en-GB")}
                </small>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[#b9b2a3]">No purchased reports.</p>
        )}
      </section>
    </main>
  );
}
