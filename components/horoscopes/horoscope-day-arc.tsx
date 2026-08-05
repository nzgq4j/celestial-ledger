import type { CSSProperties } from "react";
import type { DailyHoroscope } from "@/lib/horoscopes/daily";

type Period = DailyHoroscope["dayParts"][number]["period"];

type HoroscopeDayArcProps = {
  parts: DailyHoroscope["dayParts"];
  labels: Record<Period, string>;
  heading: string;
  introduction?: string;
  compact?: boolean;
};

export function HoroscopeDayArc({
  parts,
  labels,
  heading,
  introduction,
  compact = false,
}: HoroscopeDayArcProps) {
  return (
    <figure
      className={`horoscope-day-arc${compact ? " horoscope-day-arc--compact" : ""}`}
      aria-label={heading}
    >
      {!compact && (
        <figcaption>
          <p className="section-kicker">{heading}</p>
          {introduction && <p>{introduction}</p>}
        </figcaption>
      )}
      <ol>
        {parts.map((part) => (
          <li
            key={part.period}
            style={{ "--arc-level": part.level } as CSSProperties}
          >
            <span className="horoscope-day-arc__signal" aria-hidden="true">
              <span />
            </span>
            <div>
              <p>{labels[part.period]}</p>
              <strong>{part.theme}</strong>
              {!compact && <span>{part.guidance}</span>}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
