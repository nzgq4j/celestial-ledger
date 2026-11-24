import Link from "next/link";
import type { ReactNode } from "react";
import { TodayInsight } from "@/components/account/TodayInsight";

/**
 * Presentational Today screen in the Celestial Atlas app layout. TodayView
 * loads the data; this component only arranges it, so it can be previewed
 * without a signed-in session.
 */
export interface TodayLayoutProps {
  heading: ReactNode;
  insight?: {
    title: string;
    body: string;
    meta: string;
    now: string;
    dismiss: string;
  };
  bigThree: {
    label: string;
    items: Array<{
      key: string;
      label: string;
      glyph: string;
      sign: string;
      missing?: boolean;
    }>;
  };
  /** The personal daily reading card, or the state that replaces it. */
  feature: ReactNode;
  horoscope?: {
    kicker: string;
    overview: string;
    loveLabel: string;
    love?: string;
    href: string;
    linkLabel: string;
  };
  moon?: {
    kicker: string;
    phase: string;
    detail: string;
    text: string;
    illuminated: number;
    waxing: boolean;
    href: string;
  };
  numbers?: {
    kicker: string;
    cells: Array<{ label: string; value: number }>;
    text: string;
    href: string;
    linkLabel: string;
  };
  card?: {
    kicker: string;
    title: string;
    orientation?: string;
    reversed?: boolean;
    meaning: string;
    href: string;
    linkLabel: string;
    face: ReactNode;
  };
  /** Allowance meter and other side cards. */
  side?: ReactNode;
  /** Reports and library links at the bottom. */
  lower?: ReactNode;
}

function MoonDisc({
  illuminated,
  waxing,
  size,
}: {
  illuminated: number;
  waxing: boolean;
  size: number;
}) {
  const shift = (waxing ? -1 : 1) * Math.round(illuminated * size * 1.02);
  return (
    <span
      className="today2-moon"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="today2-moon__shade"
        style={{ transform: `translateX(${shift}px)` }}
      />
    </span>
  );
}

export function TodayLayout(props: TodayLayoutProps) {
  const { insight, bigThree, horoscope, moon, numbers, card } = props;
  return (
    <div className="today2">
      {insight && <TodayInsight {...insight} />}

      {props.heading}

      {bigThree.items.length > 0 && (
        <ul className="today2-big3" aria-label={bigThree.label}>
          {bigThree.items.map((item) => (
            <li key={item.key} className="today2-big3__cell">
              <span className="today2-big3__label">{item.label}</span>
              <span
                className={
                  item.missing
                    ? "today2-big3__glyph today2-big3__glyph--missing"
                    : "today2-big3__glyph"
                }
                aria-hidden="true"
              >
                {item.glyph}
              </span>
              <span className="today2-big3__sign">{item.sign}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="today2-feature">{props.feature}</div>

      <div className="today2-grid">
        {horoscope && (
          <section
            className="today2-panel today2-panel--stack"
            aria-label={horoscope.kicker}
          >
            <p className="today2-eyebrow">{horoscope.kicker}</p>
            <p className="today2-lead">{horoscope.overview}</p>
            {horoscope.love && (
              <p className="today2-body">
                <strong>{horoscope.loveLabel} · </strong>
                {horoscope.love}
              </p>
            )}
            <Link href={horoscope.href} className="today2-link">
              {horoscope.linkLabel} →
            </Link>
          </section>
        )}

        {moon && (
          <Link
            href={moon.href}
            className="today2-panel today2-panel--row today2-panel--link"
          >
            <MoonDisc
              illuminated={moon.illuminated}
              waxing={moon.waxing}
              size={96}
            />
            <span className="today2-moon__text">
              <span className="today2-eyebrow">{moon.kicker}</span>
              <span className="today2-title">{moon.phase}</span>
              <span className="today2-meta">{moon.detail}</span>
              <span className="today2-body">{moon.text}</span>
            </span>
          </Link>
        )}

        {numbers && (
          <section
            className="today2-panel today2-panel--stack"
            aria-label={numbers.kicker}
          >
            <p className="today2-eyebrow">{numbers.kicker}</p>
            <div className="today2-cycles">
              {numbers.cells.map((cell) => (
                <div key={cell.label} className="today2-cycles__cell">
                  <span className="today2-cycles__value">{cell.value}</span>
                  <span className="today2-cycles__label">{cell.label}</span>
                </div>
              ))}
            </div>
            <p className="today2-body">{numbers.text}</p>
            <Link href={numbers.href} className="today2-link">
              {numbers.linkLabel} →
            </Link>
          </section>
        )}

        {card && (
          <section
            className="today2-panel today2-panel--row"
            aria-label={card.kicker}
          >
            <span
              className="today2-card"
              data-reversed={card.reversed ? "true" : undefined}
            >
              {card.face}
            </span>
            <span className="today2-card__text">
              <span className="today2-eyebrow">{card.kicker}</span>
              <span className="today2-title">{card.title}</span>
              {card.orientation && (
                <span className="today2-meta today2-meta--caps">
                  {card.orientation}
                </span>
              )}
              <span className="today2-body">{card.meaning}</span>
              <Link href={card.href} className="today2-link">
                {card.linkLabel} →
              </Link>
            </span>
          </section>
        )}

        {props.side}
      </div>

      {props.lower && <div className="today2-lower">{props.lower}</div>}
    </div>
  );
}
