import Link from "next/link";

export function ClockPreview() {
  return (
    <section className="clock-preview" aria-labelledby="clock-preview-title">
      <div className="clock-preview-art" aria-hidden="true">
        <svg viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="108" />
          <circle cx="120" cy="120" r="94" />
          <circle cx="120" cy="120" r="78" />
          <circle cx="120" cy="120" r="58" />
          <circle cx="120" cy="120" r="35" />
          <path d="M120 12V85 M120 155V228 M12 120H85 M155 120H228" />
        </svg>
      </div>
      <div>
        <h2 id="clock-preview-title">A moment in the cosmos</h2>
        <p>
          See the Moon, the seasons and the planets in one living clock. Explore
          today, or choose another moment.
        </p>
      </div>
      <Link href="/clock" className="button-quiet">
        Explore the Celestial Clock
      </Link>
    </section>
  );
}
