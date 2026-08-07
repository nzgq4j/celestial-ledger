import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { GoogleAuthForm } from "@/components/GoogleAuthForm";
import { isDemoMode } from "@/lib/supabase/config";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Create an account — Celestial Atlas",
);

export default async function CreateAccountPage({
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
        <h1 className="mt-2 text-3xl font-semibold">Create your account</h1>
        <p className="mt-3 text-[#b9b2a3]">
          Keep your natal charts and readings in a private, verified account.
        </p>
        {demoMode ? (
          <p className="mt-4 rounded-lg border border-[#536177] bg-[#081524] p-3">
            Preview demo mode is active. Account creation is disabled.
          </p>
        ) : error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-[#8b5b53] bg-[#2b1718] p-3"
          >
            Your account could not be created. Check your details and try again.
          </p>
        ) : null}
        <GoogleAuthForm mode="create" disabled={demoMode} />
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[#2c394c]" />
          <span className="text-xs uppercase tracking-[.18em] text-[#8f98a6]">
            or use email
          </span>
          <span className="h-px flex-1 bg-[#2c394c]" />
        </div>
        <AuthForm mode="create" disabled={demoMode} />
        <p className="mt-5 text-sm text-[#b9b2a3]">
          Already have an account?{" "}
          <Link className="gold underline" href="/auth/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
