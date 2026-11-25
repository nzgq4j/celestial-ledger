import { IonButton, IonCard, IonItem, IonLabel, IonList, IonNote } from '@ionic/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { recordDraw } from '../engine/atlas';
import TAROT_CARDS, { type TarotCard } from '../engine/tarotData';
import { fill, useStrings } from '../i18n';
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
  const strings = useStrings();
  const s = strings.tarot;
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
  // Buttons take the deck's colours so they stay readable on light and dark decks.
  const buttonVars = { '--background': accent, '--color': readable(deck.bg, accent), '--border-color': accent } as CSSProperties;
  const outlineVars = { '--color': ink, '--border-color': 'rgba(201,168,106,0.5)' } as CSSProperties;

  const selectSpread = (id: string) => {
    const sp = SPREADS.find(r => r.id === id)!;
    setSpreadId(id); setDrawn([]); setScreen('draw');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDrawn(drawSpread(TAROT_CARDS, sp.positions)); setScreen('result'); void tap(); }, SHUFFLE_MS);
  };
  const restart = () => { clearTimeout(timer.current); setScreen('deck'); setDeckId(null); setSpreadId(null); setDrawn([]); };
  const changeReading = () => { clearTimeout(timer.current); setScreen('reading'); setDrawn([]); };
  const changeDeck = () => { clearTimeout(timer.current); setScreen('deck'); setSpreadId(null); setDrawn([]); };

  const save = () => {
    if (!spread) return;
    const rec = recordDraw(drawn, TAROT_CARDS.length, null, spread.positions);
    const body = drawn.map(d => `${d.position} — ${d.card.name} (${d.reversed ? strings.common.reversed : strings.common.upright}): ${d.reversed ? d.card.reversed : d.card.upright}`).join('\n')
      + `\n\n${buildNarrative(drawn)}`;
    app.addJournal('Tarot', `${spread.name} · ${deck.name}`, body, { recordIds: [rec.record.id], evidence: rec.evidence });
  };

  return (
    <div className={t.root} style={vars}>
      <Starfield count={40} color={accent} rings={false} contained />
      <header className={t.header}>
        <div className={t.brand}>{s.brand}</div>
        {!onChooser && (
          <nav className={t.nav} aria-label={s.nav}>
            <IonButton fill="clear" size="small" style={{ '--color': ink } as CSSProperties} onClick={changeDeck}>{fill(s.deck, { name: deck.name })}</IonButton>
            {spread && <IonButton fill="clear" size="small" style={{ '--color': ink } as CSSProperties} onClick={changeReading}>{fill(s.reading, { name: spread.name })}</IonButton>}
            <IonButton fill="clear" size="small" style={{ '--color': accentText } as CSSProperties} onClick={restart}>{s.startOver}</IonButton>
          </nav>
        )}
      </header>

      {screen === 'deck' && (
        <section className={t.section}>
          <div className={t.intro}>
            <div className={t.kicker}>{s.chooseKicker}</div>
            <h1 className={t.title}>{s.chooseTitle}</h1>
            <p className={t.lead}>{s.chooseLead}</p>
          </div>
          <div className={t.deckGrid}>
            {DECKS.map(d => (
              <IonCard key={d.id} button className={t.deckCard} onClick={() => { setDeckId(d.id); setScreen('reading'); }}>
                <div className={t.deckArt} style={{ background: d.panel }} aria-hidden="true">
                  <div className={t.deckSymbol} style={{ borderColor: d.accent }}><div style={{ borderColor: d.accent }} /></div>
                </div>
                <div className={t.deckText}>
                  <div className={t.deckName}>{d.name}</div>
                  <div className={t.deckTagline}>{d.tagline}</div>
                </div>
              </IonCard>
            ))}
          </div>
        </section>
      )}

      {screen === 'reading' && (
        <section className={t.section}>
          <div className={t.intro}>
            <div className={t.kicker}>{fill(s.deckSelected, { name: deck.name })}</div>
            <h1 className={t.title} style={{ fontSize: 36 }}>{s.depthTitle}</h1>
            <p className={t.lead}>{s.depthLead}</p>
          </div>
          <IonList className={t.spreadList} lines="full">
            {SPREADS.map(r => (
              <IonItem key={r.id} button detail onClick={() => selectSpread(r.id)}>
                <IonLabel className="ion-text-wrap">
                  <h2 className={t.deckName}>{r.name}</h2>
                  <p className={t.deckTagline}>{r.blurb}</p>
                </IonLabel>
                <IonNote slot="end" className={t.countNote}>
                  <span className={t.count}>{r.count}</span>
                  <span className={t.countLabel}>{fill(s.cards, { time: r.time })}</span>
                </IonNote>
              </IonItem>
            ))}
          </IonList>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <IonButton fill="clear" size="small" style={{ '--color': ink } as CSSProperties} onClick={changeDeck}>{s.differentDeck}</IonButton>
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
          <p className={t.lead}>{fill(s.shuffling, { name: deck.name })}</p>
        </section>
      )}

      {screen === 'result' && spread && (
        <section className={t.section}>
          <div className={t.intro}>
            <div className={t.kicker}>{spread.name} · {deck.name}</div>
            <h1 className={t.title} style={{ fontSize: 36 }}>{s.yourReading}</h1>
          </div>
          <div className={t.spreadGrid}>
            {drawn.map(d => (
              <div key={d.position} className={t.slot}>
                <div className={t.position}>{d.position}</div>
                <CardFace card={d.card} accent={accent} accentText={readable(accent, deck.panel)} panel={deck.panel} reversed={d.reversed} width={136}
                  art={deck.id === 'traditional' ? cardArt(d.card) : null} />
                <div className={t.cardName}>{d.card.name}</div>
                <div className={t.orientation}>{d.reversed ? strings.common.reversed : strings.common.upright}</div>
              </div>
            ))}
          </div>
          <div className={t.meanings}>
            <h2 className={t.h2}>{s.whatItMeans}</h2>
            {drawn.map(d => (
              <div key={d.position} className={t.meaning}>
                <div className={t.meaningHead}>{d.position} — {d.card.name} ({d.reversed ? strings.common.reversed : strings.common.upright})</div>
                <div className={t.meaningBody}>{d.reversed ? d.card.reversed : d.card.upright}</div>
              </div>
            ))}
          </div>
          <div className={t.together}>
            <h2 className={t.h2} style={{ textAlign: 'left', fontSize: 22 }}>{s.together}</h2>
            <p className={t.meaningBody} style={{ margin: 0, lineHeight: 1.75 }}>{buildNarrative(drawn)}</p>
          </div>
          <div className={t.actions}>
            <IonButton style={buttonVars} onClick={() => selectSpread(spread.id)}>{s.drawAgain}</IonButton>
            <IonButton fill="outline" style={outlineVars} onClick={save}>{strings.common.saveToJournal}</IonButton>
            <IonButton fill="outline" style={outlineVars} onClick={changeReading}>{s.differentReading}</IonButton>
            <IonButton fill="clear" style={{ '--color': ink } as CSSProperties} onClick={changeDeck}>{s.changeDeck}</IonButton>
          </div>
        </section>
      )}

      <footer className={t.footer}>{s.disclaimer}</footer>
    </div>
  );
}
