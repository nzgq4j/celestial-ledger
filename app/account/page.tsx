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
  const latestReport = reports[0];
  const nextStep = readyEntitlements.length
    ? {
        kicker: "A reading is waiting",
        title: "Your purchased report is ready to begin.",
        copy: "Choose the birth chart it belongs to, then open the next chapter of your atlas.",
        href: "#reports",
        action: "Generate my report",
      }
    : !birthProfiles.length
      ? {
          kicker: "Your first constellation",
          title: "Begin with the sky at your first breath.",
          copy: "Create your free natal chart, then save it here as the foundation of every personal reading.",
          href: "/#chart",
          action: "Create my natal chart",
        }
      : latestReport
        ? {
            kicker: "Continue your journey",
            title: "Return to your most recent reading.",
            copy: "Your report remains private in this atlas, ready whenever you want to revisit its guidance.",
            href: `/reports/${latestReport.id}`,
            action: "Open latest report",
          }
        : {
            kicker: "Your chart is anchored",
            title: "Choose the question your atlas will explore next.",
            copy: "Step inside a sample edition, then choose the private reading that meets this moment in your life.",
            href: "/samples",
            action: "Explore sample readings",
          };

  return (
    <main className="page-shell private-library account-dashboard">
      <header className="account-hero">
        <div className="account-hero__welcome">
          <p className="eyebrow">My Celestial Atlas</p>
          <h1>Welcome, {displayName}</h1>
          <p>
            Your private observatory for the charts you carry and the readings
            still unfolding.
          </p>
        </div>
        <div className="account-hero__orbit" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </header>

      <section className="atlas-next-step" aria-labelledby="next-step-title">
        <div>
          <p className="section-kicker">{nextStep.kicker}</p>
          <h2 id="next-step-title">{nextStep.title}</h2>
          <p>{nextStep.copy}</p>
        </div>
        <Link href={nextStep.href} className="button-primary">
          {nextStep.action}
        </Link>
      </section>

      <div className="account-stats" aria-label="Account summary">
        <span>
          <strong>{birthProfiles.length}</strong> saved{" "}
          {birthProfiles.length === 1 ? "chart" : "charts"}
        </span>
        <span>
          <strong>{reports.length}</strong> private{" "}
          {reports.length === 1 ? "reading" : "readings"}
        </span>
        <span>
          <strong>{readyEntitlements.length}</strong> ready to generate
        </span>
      </div>

      {notice && (
        <p className="account-notice" role="status">
          {notice}
        </p>
      )}

      <nav className="account-jump-links" aria-label="Account sections">
        <a href="#reports">My readings</a>
        <a href="#birth-profiles">My birth charts</a>
        <a href="#account-settings">Settings</a>
      </nav>

      <section
        className="dashboard-panel dashboard-panel--reports"
        id="reports"
      >
        <div className="dashboard-panel__heading">
          <div>
            <p className="section-kicker">Your private library</p>
            <h2>Readings and reports</h2>
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

      <section
        className="dashboard-panel dashboard-panel--charts"
        id="birth-profiles"
      >
        <div className="dashboard-panel__heading">
          <div>
            <p className="section-kicker">The foundation of your atlas</p>
            <h2>Saved birth charts</h2>
          </div>
          <Link href="/#chart" className="text-link">
            Create another chart →
          </Link>
        </div>
        <BirthProfileList initialProfiles={birthProfiles} />
      </section>

      <AccountSettings
        displayName={profile?.display_name ?? ""}
        email={authData.user.email ?? ""}
      />
    </main>
  );
}
