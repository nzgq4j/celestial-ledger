import { requestPasswordReset } from "../actions";
import "@/app/styles/atlas-public.css";

export const metadata = {
  title: "Reset password — Celestial Atlas",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  return (
    <main className="auth-page">
      <section className="panel atlas-auth">
        <p className="atlas-kicker">Celestial Atlas</p>
        <h1 className="atlas-auth__title">Reset your password</h1>
        <p className="atlas-auth__copy">
          Enter your account email. If it matches an account, Supabase will send
          a secure recovery link.
        </p>
        {sent && (
          <p role="status" className="atlas-auth__notice">
            If an account exists for that address, a recovery email has been
            sent.
          </p>
        )}
        {error && (
          <p role="alert" className="atlas-public-alert">
            The reset request could not be submitted.
          </p>
        )}
        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <div className="atlas-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <button className="atlas-button atlas-auth__submit">
            Send recovery link
          </button>
        </form>
      </section>
    </main>
  );
}
