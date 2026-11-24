import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { CalcRecord, Evidence } from '../engine/records';
import type { TarotCard } from '../engine/tarotData';
import css from './components.module.css';

/* ---------- Background ---------- */

export function Starfield({ count = 70, color = 'var(--gold-bright)', rings = true, contained = false }: {
  count?: number; color?: string; rings?: boolean; contained?: boolean;
}) {
  const stars = useMemo(() => Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, size: Math.random() < 0.15 ? 3 : 2,
    dur: `${2 + Math.random() * 4}s`, delay: `${Math.random() * 4}s`,
  })), [count]);
  return (
    <div className={contained ? `${css.sky} ${css.skyContained}` : css.sky} aria-hidden="true">
      {rings && (
        <>
          <div className={css.ringBig}>
            <div className={css.ringDash} />
            <div className={css.ringInner} />
            <div className={css.axisV} />
            <div className={css.axisH} />
          </div>
          <div className={css.ringSmall} />
        </>
      )}
      {stars.map((s, i) => (
        <div key={i} className={css.star}
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, background: color, animationDuration: s.dur, animationDelay: s.delay }} />
      ))}
    </div>
  );
}

/** The small gold astrolabe mark used in the top bar. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <span className={css.mark} style={{ width: size, height: size }} aria-hidden="true">
      <span style={{ width: Math.round(size / 4), height: Math.round(size / 4) }} />
    </span>
  );
}

/* ---------- Navigation ---------- */

export function SubTabs<T extends string>({ items, value, onChange, label }: {
  items: ReadonlyArray<readonly [T, string]>; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className={css.subtabs} role="tablist" aria-label={label}>
      {items.map(([id, text]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id}
          className={value === id ? `${css.subtab} ${css.subtabOn}` : css.subtab} onClick={() => onChange(id)}>
          {text}
        </button>
      ))}
    </div>
  );
}

/* ---------- Moon ---------- */

export function MoonDisc({ size, illum, waxing, label }: { size: number; illum: number; waxing: boolean; label: string }) {
  const shift = (waxing ? -1 : 1) * Math.round(illum * size * 1.02);
  return (
    <div className={css.moon} style={{ width: size, height: size }} role="img" aria-label={label}>
      <div className={css.moonShade} style={{ transform: `translateX(${shift}px)` }} />
    </div>
  );
}

/* ---------- Ratings ---------- */

export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="label-caps" style={{ marginBottom: 6 }}>{label}</div>
      <div className={css.segs} role="img" aria-label={`${label}: ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map(i => <div key={i} className={i <= value ? css.segOn : css.seg} />)}
      </div>
    </div>
  );
}

export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
      <div style={{ width: `${value}%` }} />
    </div>
  );
}

/* ---------- Tarot card faces ---------- */

export const ROMAN = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

const ART = import.meta.glob<string>('../assets/cards/*.webp', { eager: true, query: '?url', import: 'default' });
/** Traditional deck art exists for Major Arcana I–XX. */
export function cardArt(card: TarotCard): string | null {
  if (card.arcana !== 'major' || card.num < 1 || card.num > 20) return null;
  return ART[`../assets/cards/${card.id}.webp`] ?? null;
}

/** Symbolic face for cards without art: corner label, suit symbol, inverted corner label. */
export function CardFace({ card, accent, accentText = accent, panel, art, reversed, width, compact = false }: {
  card: TarotCard; accent: string; /** accent adjusted for text contrast on the card panel */ accentText?: string;
  panel: string; art: string | null; reversed: boolean; width: number; compact?: boolean;
}) {
  const isMajor = card.arcana === 'major';
  const corner = compact
    ? (isMajor ? `${ROMAN[card.num]} · ${card.name}` : card.name)
    : (isMajor ? ROMAN[card.num] : card.name.split(' of ')[0]);
  const style = { width, '--accent': accent, '--accent-text': accentText, background: panel, transform: reversed ? 'rotate(180deg)' : 'none' } as CSSProperties;
  return (
    <div className={compact ? `${css.card} ${css.cardCompact}` : css.card} style={style} role="img"
      aria-label={`${card.name}${reversed ? ', reversed' : ''}`}>
      {art ? <img src={art} alt="" className={css.cardArt} /> : compact ? (
        <div className={css.cardInnerCompact}>
          <div className={css.majorSymbol} style={{ width: 30, height: 30 }}><div style={{ width: 12, height: 12 }} /></div>
          <div className={css.cornerCompact}>{corner}</div>
        </div>
      ) : (
        <>
          <div className={css.cardBorder} />
          <div className={css.corner}>{corner}</div>
          <div className={css.symbolWrap}><SuitSymbol card={card} /></div>
          <div className={css.corner} style={{ transform: 'rotate(180deg)' }}>{corner}</div>
        </>
      )}
    </div>
  );
}

function SuitSymbol({ card }: { card: TarotCard }) {
  if (card.arcana === 'major') return <div className={css.majorSymbol}><div /></div>;
  switch (card.suit) {
    case 'wands': return <div className={css.wand} />;
    case 'cups': return <div className={css.cup}><div /><div /><div /></div>;
    case 'swords': return <div className={css.sword}><div /><div /><div /></div>;
    case 'pentacles': return <div className={css.pentacle} />;
  }
}

/* ---------- Calculation details ---------- */

const RECORD_LABELS: Record<string, string> = {
  id: 'Record ID', calculationVersion: 'Calculation version', engine: 'Engine', engineVersion: 'Engine version',
  zodiac: 'Zodiac', coordinateFrame: 'Positions', houseSystem: 'House system', nodeType: 'Lunar node', placeData: 'Place data',
  placeId: 'GeoNames ID', latitude: 'Latitude', longitude: 'Longitude', timeZone: 'Time zone', localDate: 'Local date',
  localTime: 'Local time', timeResolution: 'Time handling', utc: 'UTC', utcOffsetMinutes: 'UTC offset (minutes)',
  timeKnown: 'Birth time known', moonSignUncertain: 'Moon sign uncertain', method: 'Method', masterNumbers: 'Master numbers',
  birthDate: 'Birth date', referenceDate: 'Reference date', nameHash: 'Name fingerprint', seedHash: 'Seed fingerprint',
  deckSize: 'Deck size', count: 'Cards drawn',
};

const show = (v: unknown): string => v === null ? 'none' : Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v);

/** A collapsible list of the records and evidence behind what is on screen. */
export function CalcDetails({ records, evidence, summary = 'How this was calculated', children }: {
  records: CalcRecord[]; evidence?: Evidence[]; summary?: string; children?: ReactNode;
}) {
  return (
    <details className="calc">
      <summary>{summary}</summary>
      {children}
      {records.map(r => (
        <dl key={r.id}>
          {Object.entries(r).filter(([k]) => k !== 'kind').map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{RECORD_LABELS[k] ?? k}</dt>
              <dd>{k === 'id' ? <code>{show(v)}</code> : show(v)}</dd>
            </div>
          ))}
        </dl>
      ))}
      {evidence && evidence.length > 0 && (
        <dl>
          {evidence.map(e => (
            <div key={e.id} style={{ display: 'contents' }}>
              <dt><code>{e.id}</code></dt>
              <dd>{e.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </details>
  );
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div className={css.toastRegion} role="status" aria-live="polite">
      {message && <div className={css.toast}>{message}</div>}
    </div>
  );
}
