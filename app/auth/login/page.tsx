import { isDemoMode } from "@/lib/supabase/config";
import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";

export const metadata = { title: "Sign in — Celestial Atlas" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const demoMode = isDemoMode();
  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-16">
      <section className="panel p-6 md:p-8">
        <p className="gold text-xs uppercase tracking-[.22em]">
          Celestial Atlas
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Your private account</h1>
        <p className="mt-3 text-[#b9b2a3]">
          Sign in with a verified email and password to manage saved birth
          profiles and reports.
        </p>
        {demoMode ? (
          <p className="mt-4 rounded-lg border border-[#536177] bg-[#081524] p-3">
            Preview demo mode is active. Authentication and production data
            access are disabled.
          </p>
        ) : error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-[#8b5b53] bg-[#2b1718] p-3"
          >
            Authentication could not be completed. Check your details and try
            again.
          </p>
        ) : null}
        <AuthForm disabled={demoMode} />
        <p className="mt-4 text-sm">
          <Link className="gold underline" href="/auth/forgot-password">
            Forgot your password?
          </Link>
        </p>
      </section>
    </main>
  );
}
