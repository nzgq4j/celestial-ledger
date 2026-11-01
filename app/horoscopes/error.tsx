"use client";

import "@/app/styles/atlas-public.css";

export default function HoroscopeEditionError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="atlas-shell sign-page horoscope-edition-error">
      <p className="atlas-kicker">Daily horoscopes</p>
      <h1 className="atlas-page-title">
        Today’s edition is still being prepared
      </h1>
      <p className="sign-page__intro">
        The complete twelve-sign edition has not passed its editorial checks
        yet. We are retrying it rather than showing recycled copy.
      </p>
      <button className="atlas-button" type="button" onClick={reset}>
        Check again
      </button>
    </main>
  );
}
