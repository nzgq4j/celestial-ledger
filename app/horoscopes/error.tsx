"use client";

export default function HoroscopeEditionError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell horoscope-edition-error">
      <p className="eyebrow">Daily horoscopes</p>
      <h1>Today’s edition is still being prepared</h1>
      <p>
        The complete twelve-sign edition has not passed its editorial checks
        yet. We are retrying it rather than showing recycled copy.
      </p>
      <button className="button-primary" type="button" onClick={reset}>
        Check again
      </button>
    </main>
  );
}
