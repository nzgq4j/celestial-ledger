import { updatePassword } from "../actions";

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
    <main className="mx-auto min-h-screen max-w-xl px-5 py-16">
      <section className="panel p-6 md:p-8">
        <p className="gold text-xs uppercase tracking-[.22em]">
          Celestial Atlas
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Choose a new password</h1>
        <p className="mt-3 text-[#b9b2a3]">
          Use at least 12 characters and a unique password.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-[#8b5b53] p-3"
          >
            The password could not be updated. The recovery link may have
            expired.
          </p>
        )}
        <form action={updatePassword} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </div>
          <button className="rounded-lg bg-[#c9a75d] px-5 py-3 font-semibold text-[#07111f]">
            Update password
          </button>
        </form>
      </section>
    </main>
  );
}
