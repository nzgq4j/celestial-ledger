import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";
import { BirthProfileList } from "@/components/BirthProfileList";
import { CheckoutButton } from "@/components/CheckoutButton";

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
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-12">
      <section className="panel p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="gold text-xs uppercase tracking-[.22em]">
              Private account
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Report library</h1>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-[#536177] px-4 py-2">
              Sign out
            </button>
          </form>
        </div>
        <p className="mt-4 text-[#b9b2a3]">
          Adult confirmation:{" "}
          {profile?.adult_confirmed_at ? "recorded" : "not recorded"}
        </p>
      </section>
      <section className="panel mt-6 p-6">
        <h2 className="text-xl gold">Birth profiles</h2>
        <BirthProfileList initialProfiles={birthProfiles ?? []} />
      </section>
      <section className="panel mt-6 p-6">
        <h2 className="text-xl gold">Available reports</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(products ?? []).map((product) => (
            <article
              key={product.report_type}
              className="rounded-lg border border-[#34455c] p-4"
            >
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
      <section className="panel mt-6 p-6">
        <h2 className="text-xl gold">Entitlements</h2>
        <p className="mt-3 text-[#b9b2a3]">
          {entitlements?.length
            ? `${entitlements.length} purchased report entitlement(s).`
            : "No report entitlements yet."}
        </p>
      </section>
      <section className="panel mt-6 p-6">
        <h2 className="text-xl gold">Reports</h2>
        <p className="mt-3 text-[#b9b2a3]">
          {reports?.length
            ? `${reports.length} report(s).`
            : "No purchased reports."}
        </p>
      </section>
    </main>
  );
}
