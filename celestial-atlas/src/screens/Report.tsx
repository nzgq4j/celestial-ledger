import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';
import { fill, useStrings } from '../i18n';
import { useApp } from '../state/store';
import { CalcDetails, ROMAN } from '../ui/components';

export function ReportScreen() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.report;
  const rep = app.report!, p = app.profile!, { chart, nums } = app.derived!, now = app.now;
  const moon = chart.moon.uncertain ? chart.moon.possibleSigns.map(x => x.name).join(' / ') : chart.moon.sign.name;
  const sub = fill(s.sub, {
    sun: chart.sun.sign.name, moon, lp: nums.lifePath,
    rising: chart.rising ? fill(s.rising, { sign: chart.rising.sign.name }) : '',
  });

  const saveReport = () => app.addJournal(
    'Atlas Report', `Atlas Report · ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    rep.sections.map(x => `${x.h}\n${x.body}`).join('\n\n') + '\n\n' + rep.cards.map(c => `${c.position}: ${c.name} (${c.orientation}) — ${c.meaning}`).join('\n'),
    { recordIds: rep.recordIds, evidence: rep.evidence },
  );

  return (
    <div className="screen fade-up" style={{ gap: 22, maxWidth: 780 }}>
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <div className="eyebrow" style={{ letterSpacing: '0.22em', marginBottom: 12 }}>
          {fill(s.kicker, { date: now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) })}
        </div>
        <h1 className="display" style={{ fontSize: 42, lineHeight: 1.05, marginBottom: 12 }}>{p.name}</h1>
        <div className="small">{sub}</div>
      </div>
      {rep.sections.map((sec, i) => (
        <IonCard key={sec.h} data-evidence={sec.evidenceIds.join(' ')}>
          <IonCardHeader>
            <IonCardSubtitle className="eyebrow">{ROMAN[i + 1]}</IonCardSubtitle>
            <IonCardTitle className="serif" style={{ fontSize: 25 }}>{sec.h}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p className="body" style={{ fontSize: 16, lineHeight: 1.75, textWrap: 'pretty' }}>{sec.body}</p>
          </IonCardContent>
        </IonCard>
      ))}
      <h2 className="serif" style={{ fontSize: 25, fontWeight: 600, margin: '6px 0 0', color: 'var(--ink)' }}>{s.cardsTitle}</h2>
      <div className="grid-auto" style={{ gap: 14 }}>
        {rep.cards.map(c => (
          <IonCard key={c.position} data-evidence={c.evidenceId}>
            <IonCardHeader>
              <IonCardSubtitle className="eyebrow">{c.position}</IonCardSubtitle>
              <IonCardTitle className="serif" style={{ fontSize: 21 }}>{c.name}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="label-caps">{c.orientation === 'Reversed' ? strings.common.reversed : strings.common.upright}</div>
              <p className="body" style={{ fontSize: 14, marginTop: 6 }}>{c.meaning}</p>
            </IonCardContent>
          </IonCard>
        ))}
      </div>
      <IonButton expand="block" onClick={saveReport}>{s.save}</IonButton>
      <CalcDetails records={rep.records} evidence={Object.values(rep.evidence)} summary={strings.common.howCalculated}>
        <p className="note" style={{ margin: '4px 0 0' }}>{s.calcNote}</p>
      </CalcDetails>
    </div>
  );
}
