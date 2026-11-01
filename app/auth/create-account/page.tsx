import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { GoogleAuthForm } from "@/components/GoogleAuthForm";
import { isDemoMode } from "@/lib/supabase/config";
import { privatePageMetadata } from "@/lib/seo";
import "@/app/styles/atlas-public.css";

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
    <main className="auth-page">
      <section className="panel atlas-auth">
        <p className="atlas-kicker">Celestial Atlas</p>
        <h1 className="atlas-auth__title">Create your account</h1>
        <p className="atlas-auth__copy">
          Keep your natal charts and readings in a private, verified account.
        </p>
        {demoMode ? (
          <p className="atlas-auth__notice">
            Preview demo mode is active. Account creation is disabled.
          </p>
        ) : error ? (
          <p role="alert" className="atlas-public-alert">
            Your account could not be created. Check your details and try again.
          </p>
        ) : null}
        <GoogleAuthForm mode="create" disabled={demoMode} />
        <div className="atlas-auth__divider" aria-hidden="true">
          <span />
          <span>or use email</span>
          <span />
        </div>
        <AuthForm mode="create" disabled={demoMode} />
        <p className="atlas-auth__copy">
          Already have an account?{" "}
          <Link className="atlas-link" href="/auth/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
