import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/AccountSettings";
import { BirthProfileList } from "@/components/BirthProfileList";
import { CheckoutButton } from "@/components/CheckoutButton";
import { GenerateReportButton } from "@/components/GenerateReportButton";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Account — Celestial Atlas",
  robots: { index: false, follow: false, nocache: true },
};

const notices: Record<string, string> = {
  name_updated: "Display name updated.",
  password_updated: "Password changed successfully.",
  invalid_name: "Use a display name between 2 and 50 characters.",
  name_failed: "Your display name could not be updated.",
  invalid_password: "Passwords must match and contain at least 12 characters.",
  current_password_failed: "Your current password was not accepted.",
  password_failed: "Your password could not be changed.",
  delete_confirmation_failed: "Account deletion was not confirmed.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (isDemoMode()) redirect("/auth/login");
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) redirect("/auth/login");

  const [
    params,
    profileResult,
    birthProfileResult,
    reportResult,
    productResult,
    entitlementResult,
  ] = await Promise.all([
    searchParams,
    supabase
      .from("profiles")
      .select("display_name, adult_confirmed_at, created_at")
      .single(),
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

  const profile = profileResult.data;
  const birthProfiles = birthProfileResult.data ?? [];
  const reports = reportResult.data ?? [];
  const products = productResult.data ?? [];
  const entitlements = entitlementResult.data ?? [];
  const readyEntitlements = entitlements.filter(
    (item) =>
      item.status === "unused" &&
      ["career_purpose", "recovery_reflection"].includes(item.report_type),
  );
  const displayName =
    profile?.display_name?.trim() ||
    authData.user.email?.split("@")[0] ||
    "Explorer";
  const notice = params.notice ? notices[params.notice] : undefined;

  return (
    <main className="page-shell private-library account-dashboard">
      <header className="account-hero">
        <div>
          <p className="eyebrow">My Celestial Atlas</p>
          <h1>Welcome, {displayName}</h1>
          <p>
            Your charts, reports, and account settings in one private place.
          </p>
        </div>
        <div className="account-stats" aria-label="Account summary">
          <span>
            <strong>{birthProfiles.length}</strong> birth{" "}
            {birthProfiles.length === 1 ? "profile" : "profiles"}
          </span>
          <span>
            <strong>{reports.length}</strong>{" "}
            {reports.length === 1 ? "report" : "reports"}
          </span>
          <span>
            <strong>{readyEntitlements.length}</strong> ready to generate
          </span>
        </div>
      </header>

      {notice && (
        <p className="account-notice" role="status">
          {notice}
        </p>
      )}

      <nav className="account-jump-links" aria-label="Account sections">
        <a href="#birth-profiles">Birth profiles</a>
        <a href="#reports">Reports</a>
        <a href="#account-settings">Account settings</a>
      </nav>

      <section className="dashboard-panel" id="birth-profiles">
        <div className="dashboard-panel__heading">
          <div>
            <p className="section-kicker">Source material</p>
            <h2>Birth profiles</h2>
          </div>
          <Link href="/#chart" className="text-link">
            Create another chart
          </Link>
        </div>
        <BirthProfileList initialProfiles={birthProfiles} />
      </section>

      <section className="dashboard-panel" id="reports">
        <div className="dashboard-panel__heading">
          <div>
            <p className="section-kicker">My Celestial Atlas</p>
            <h2>Reports</h2>
          </div>
          <span className="dashboard-panel__meta">{reports.length} saved</span>
        </div>

        {readyEntitlements.map((entitlement) => (
          <article className="ready-report" key={entitlement.id}>
            <div>
              <strong>
                {entitlement.report_type === "recovery_reflection"
                  ? "Recovery Reflection"
                  : "Career and Purpose"}
              </strong>
              <p>Purchased and ready to generate.</p>
            </div>
            <GenerateReportButton
              entitlementId={entitlement.id}
              reportType={entitlement.report_type}
              profiles={birthProfiles.map((item) => ({
                id: item.id,
                label: item.label,
              }))}
            />
          </article>
        ))}

        {reports.length ? (
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
          <p className="dashboard-empty">
            No reports yet. Choose a report below when you are ready.
          </p>
        )}

        <div className="compact-products">
          {products
            .filter((product) =>
              ["career_purpose", "recovery_reflection"].includes(
                product.report_type,
              ),
            )
            .map((product) => (
              <article key={product.report_type}>
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className="compact-products__action">
                  <strong>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: product.currency ?? "USD",
                    }).format((product.unit_amount ?? 0) / 100)}
                  </strong>
                  {birthProfiles.length ? (
                    <CheckoutButton reportType={product.report_type} />
                  ) : (
                    <Link href="/#chart" className="button-primary">
                      Create natal chart
                    </Link>
                  )}
                </div>
              </article>
            ))}
        </div>
      </section>

      <AccountSettings
        displayName={profile?.display_name ?? ""}
        email={authData.user.email ?? ""}
      />
    </main>
  );
}
