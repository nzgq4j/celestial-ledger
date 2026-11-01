import type { DailyHoroscope } from "@/lib/horoscopes/daily";

type Period = DailyHoroscope["dayParts"][number]["period"];

type HoroscopeDayArcProps = {
  parts: DailyHoroscope["dayParts"];
  labels: Record<Period, string>;
  heading: string;
  introduction?: string;
  compact?: boolean;
};

/**
 * Morning, midday and evening rows. Each row is keyed by its period so the
 * layout never encodes a reading "intensity".
 */
export function HoroscopeDayArc({
  parts,
  labels,
  heading,
  introduction,
  compact = false,
}: HoroscopeDayArcProps) {
  return (
    <figure
      className={`sign-arc${compact ? " sign-arc--compact" : ""}`}
      aria-label={heading}
    >
      {introduction && (
        <figcaption className="sr-only">{introduction}</figcaption>
      )}
      <ol>
        {parts.map((part) => (
          <li key={part.period} data-period={part.period}>
            <span className="sign-arc__when">{labels[part.period]}</span>
            <span className="sign-arc__text">
              <strong>{part.theme}</strong>
              {!compact && <span>{part.guidance}</span>}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
