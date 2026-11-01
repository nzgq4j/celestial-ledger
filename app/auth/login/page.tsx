import { isDemoMode } from "@/lib/supabase/config";
import { AuthForm } from "@/components/AuthForm";
import { GoogleAuthForm } from "@/components/GoogleAuthForm";
import Link from "next/link";
import { privatePageMetadata } from "@/lib/seo";
import "@/app/styles/atlas-public.css";

export const metadata = privatePageMetadata("Sign in — Celestial Atlas");

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const demoMode = isDemoMode();
  return (
    <main className="auth-page">
      <section className="panel atlas-auth">
        <p className="atlas-kicker">Celestial Atlas</p>
        <h1 className="atlas-auth__title">Sign in</h1>
        <p className="atlas-auth__copy">
          Sign in with a verified email and password to manage saved birth
          profiles and reports.
        </p>
        {demoMode ? (
          <p className="atlas-auth__notice">
            Preview demo mode is active. Authentication and production data
            access are disabled.
          </p>
        ) : error ? (
          <p role="alert" className="atlas-public-alert">
            Authentication could not be completed. Check your details and try
            again.
          </p>
        ) : null}
        <GoogleAuthForm mode="login" disabled={demoMode} />
        <div className="atlas-auth__divider" aria-hidden="true">
          <span />
          <span>or use email</span>
          <span />
        </div>
        <AuthForm mode="login" disabled={demoMode} />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link className="atlas-link" href="/auth/forgot-password">
            Forgot your password?
          </Link>
          <Link
            className="atlas-button-ghost atlas-button--sm"
            href="/auth/create-account"
          >
            Create an account
          </Link>
        </div>
      </section>
    </main>
  );
}
