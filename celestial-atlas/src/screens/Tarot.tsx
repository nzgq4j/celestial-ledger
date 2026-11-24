import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { recordDraw } from '../engine/atlas';
import TAROT_CARDS, { type TarotCard } from '../engine/tarotData';
import { tap } from '../platform/native';
import { useApp } from '../state/store';
import { readable } from '../ui/color';
import { CardFace, Starfield, cardArt } from '../ui/components';
import { CHOOSER, DECKS, SPREADS, buildNarrative, drawSpread, type DrawnCard } from './tarotDecks';
import t from './tarot.module.css';

type Screen = 'deck' | 'reading' | 'draw' | 'result';
const SHUFFLE_MS = 1700;

export function Tarot() {
  const app = useApp();
  const [screen, setScreen] = useState<Screen>('deck');
  const [deckId, setDeckId] = useState<string | null>(null);
  const [spreadId, setSpreadId] = useState<string | null>(null);
  const [drawn, setDrawn] = useState<DrawnCard<TarotCard>[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const deck = DECKS.find(d => d.id === deckId) ?? DECKS[0];
  const spread = SPREADS.find(r => r.id === spreadId) ?? null;
  const onChooser = screen === 'deck';
  const bg = onChooser ? CHOOSER.bg : deck.bg, ink = onChooser ? CHOOSER.ink : deck.ink, accent = onChooser ? CHOOSER.accent : deck.accent;
  const accentText = readable(accent, bg);
  const vars = { '--t-bg': bg, '--t-ink': ink, '--t-accent': accent, '--t-accent-text': accentText, '--t-panel': deck.panel } as CSSProperties;

  const selectSpread = (id: string) => {
    const s = SPREADS.find(r => r.id === id)!;
    setSpreadId(id); setDrawn([]); setScreen('draw');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDrawn(drawSpread(TAROT_CARDS, s.positions)); setScreen('result'); void tap(); }, SHUFFLE_MS);
  };
  const restart = () => { clearTimeout(timer.current); setScreen('deck'); setDeckId(null); setSpreadId(null); setDrawn([]); };
  const changeReading = () => { clearTimeout(timer.current); setScreen('reading'); setDrawn([]); };
  const changeDeck = () => { clearTimeout(timer.current); setScreen('deck'); setSpreadId(null); setDrawn([]); };

  const save = () => {
    if (!spread) return;
    const rec = recordDraw(drawn, TAROT_CARDS.length, null, spread.positions);
    const body = drawn.map(d => `${d.position} — ${d.card.name} (${d.reversed ? 'Reversed' : 'Upright'}): ${d.reversed ? d.card.reversed : d.card.upright}`).join('\n')
      + `\n\n${buildNarrative(drawn)}`;
    app.addJournal('Tarot', `${spread.name} · ${deck.name}`, body, { recordIds: [rec.record.id], evidence: rec.evidence });
  };

  return (
    <div className={t.root} style={vars}>
      <Starfield count={40} color={accent} rings={false} contained />
      <header className={t.header}>
        <div className={t.brand}>Tarot &amp; Threshold</div>
        {!onChooser && (
          <nav className={t.nav} aria-label="Tarot">
            <button type="button" className={t.navBtn} onClick={changeDeck}>Deck: {deck.name}</button>
            {spread && <button type="button" className={t.navBtn} onClick={changeReading}>Reading: {spread.name}</button>}
            <button type="button" className={t.navBtn} style={{ color: 'var(--t-accent-text)' }} onClick={restart}>Start Over</button>
          </nav>
        )}
      </header>

      {screen === 'deck' && (
        <section className={t.section}>
          <div className={t.intro}>
            <div className={t.kicker}>Choose your deck</div>
            <h1 className={t.title}>Five decks. One question worth asking.</h1>
            <p className={t.lead}>Every deck holds the same 78 cards and reads the same, upright or reversed — the art just meets you where your taste is.</p>
          </div>
          <div className={t.deckGrid}>
            {DECKS.map(d => (
              <button key={d.id} type="button" className={t.deckCard} onClick={() => { setDeckId(d.id); setScreen('reading'); }}>
                <div className={t.deckArt} style={{ background: d.panel }} aria-hidden="true">
                  <div className={t.deckSymbol} style={{ borderColor: d.accent }}><div style={{ borderColor: d.accent }} /></div>
                </div>
                <div className={t.deckText}>
                  <div className={t.deckName}>{d.name}</div>
                  <div className={t.deckTagline}>{d.tagline}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === 'reading' && (
        <section className={t.section}>
          <div className={t.intro}>
            <div className={t.kicker}>{deck.name} deck selected</div>
            <h1 className={t.title} style={{ fontSize: 38 }}>How deep do you want to go?</h1>
            <p className={t.lead}>From a single card to the full life-and-love spread — every card can land upright or reversed.</p>
          </div>
          <div className="stack" style={{ gap: 14 }}>
            {SPREADS.map(r => (
              <button key={r.id} type="button" className={t.spread} onClick={() => selectSpread(r.id)}>
                <div>
                  <div className={t.deckName}>{r.name}</div>
                  <div className={t.deckTagline}>{r.blurb}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className={t.count}>{r.count}</div>
                  <div className={t.countLabel}>cards · {r.time}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button type="button" className={t.quiet} onClick={changeDeck}>← choose a different deck</button>
          </div>
        </section>
      )}

      {screen === 'draw' && spread && (
        <section className={t.section} style={{ textAlign: 'center', paddingTop: 40 }} role="status">
          <div className={t.kicker} style={{ marginBottom: 28 }}>{spread.name}</div>
          <div className={t.shuffle} aria-hidden="true">
            <div className={t.shuffleCard} style={{ animation: 'shuffleA 1.4s ease-in-out infinite' }} />
            <div className={t.shuffleCard} style={{ animation: 'shuffleB 1.4s ease-in-out infinite', animationDelay: '0.15s' }} />
            <div className={t.shuffleCard} style={{ animation: 'shuffleC 1.6s ease-in-out infinite', animationDelay: '0.3s' }} />
          </div>
          <p className={t.lead}>Shuffling {deck.name}…</p>
        </section>
      )}

      {screen === 'result' && spread && (
        <section className={t.section}>
          <div className={t.intro}>
            <div className={t.kicker}>{spread.name} · {deck.name}</div>
            <h1 className={t.title} style={{ fontSize: 36 }}>Your Reading</h1>
          </div>
          <div className={t.spreadGrid}>
            {drawn.map(d => (
              <div key={d.position} className={t.slot}>
                <div className={t.position}>{d.position}</div>
                <CardFace card={d.card} accent={accent} accentText={readable(accent, deck.panel)} panel={deck.panel} reversed={d.reversed} width={136}
                  art={deck.id === 'traditional' ? cardArt(d.card) : null} />
                <div className={t.cardName}>{d.card.name}</div>
                <div className={t.orientation}>{d.reversed ? 'Reversed' : 'Upright'}</div>
              </div>
            ))}
          </div>
          <div className={t.meanings}>
            <h2 className={t.h2}>What it means</h2>
            {drawn.map(d => (
              <div key={d.position} className={t.meaning}>
                <div className={t.meaningHead}>{d.position} — {d.card.name} ({d.reversed ? 'Reversed' : 'Upright'})</div>
                <div className={t.meaningBody}>{d.reversed ? d.card.reversed : d.card.upright}</div>
              </div>
            ))}
          </div>
          <div className={t.together}>
            <h2 className={t.h2} style={{ textAlign: 'left', fontSize: 22 }}>Reading it together</h2>
            <p className={t.meaningBody} style={{ margin: 0, lineHeight: 1.75 }}>{buildNarrative(drawn)}</p>
          </div>
          <div className={t.actions}>
            <button type="button" className={t.primary} style={{ color: readable(deck.bg, accent) }} onClick={() => selectSpread(spread.id)}>Draw Again</button>
            <button type="button" className={t.secondary} onClick={save}>Save to journal</button>
            <button type="button" className={t.secondary} onClick={changeReading}>Different Reading</button>
            <button type="button" className={t.quiet} onClick={changeDeck}>Change Deck</button>
          </div>
        </section>
      )}

      <footer className={t.footer}>For reflection and entertainment — not a substitute for professional advice.</footer>
    </div>
  );
}
