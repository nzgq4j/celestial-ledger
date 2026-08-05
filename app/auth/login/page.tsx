import { isDemoMode } from "@/lib/supabase/config";
import { AuthForm } from "@/components/AuthForm";
import { signInWithGoogle } from "@/app/auth/actions";
import Link from "next/link";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata("Sign in — Celestial Atlas");

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
        <form action={signInWithGoogle} className="mt-6">
          <button
            type="submit"
            disabled={demoMode}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#536177] bg-[#f7f4ec] px-5 py-3 font-semibold text-[#172033] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                fill="#4285F4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#FBBC05"
                d="M6.39 13.87A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.62Z"
              />
              <path
                fill="#EA4335"
                d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z"
              />
            </svg>
            Continue with Google
          </button>
          <p className="mt-2 text-center text-xs text-[#8f98a6]">
            Sign in or create your Celestial Atlas account with Google.
          </p>
        </form>
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-[#2c394c]" />
          <span className="text-xs uppercase tracking-[.18em] text-[#8f98a6]">
            or use email
          </span>
          <span className="h-px flex-1 bg-[#2c394c]" />
        </div>
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
