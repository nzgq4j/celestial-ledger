import { requestPasswordReset } from "../actions";

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
    <main className="auth-page mx-auto min-h-screen max-w-xl px-5 py-16">
      <section className="panel p-6 md:p-8">
        <p className="gold text-xs uppercase tracking-[.22em]">
          Celestial Atlas
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Reset your password</h1>
        <p className="mt-3 text-[#b9b2a3]">
          Enter your account email. If it matches an account, Supabase will send
          a secure recovery link.
        </p>
        {sent && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-[#536177] p-3"
          >
            If an account exists for that address, a recovery email has been
            sent.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-[#8b5b53] p-3"
          >
            The reset request could not be submitted.
          </p>
        )}
        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <button className="rounded-lg bg-[#c9a75d] px-5 py-3 font-semibold text-[#07111f]">
            Send recovery link
          </button>
        </form>
      </section>
    </main>
  );
}
