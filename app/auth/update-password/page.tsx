import { updatePassword } from "../actions";
import "@/app/styles/atlas-public.css";

export const metadata = {
  title: "Choose a new password — Celestial Atlas",
  robots: { index: false, follow: false },
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="auth-page">
      <section className="panel atlas-auth">
        <p className="atlas-kicker">Celestial Atlas</p>
        <h1 className="atlas-auth__title">Choose a new password</h1>
        <p className="atlas-auth__copy">
          Use at least 12 characters and a unique password.
        </p>
        {error && (
          <p role="alert" className="atlas-public-alert">
            The password could not be updated. The recovery link may have
            expired.
          </p>
        )}
        <form action={updatePassword} className="mt-6 space-y-4">
          <div className="atlas-field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="atlas-button atlas-auth__submit">
            Update password
          </button>
        </form>
      </section>
    </main>
  );
}
