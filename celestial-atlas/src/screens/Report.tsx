import { useApp } from '../state/store';
import { CalcDetails, ROMAN } from '../ui/components';

export function ReportScreen() {
  const app = useApp();
  const rep = app.report!, p = app.profile!, { chart, nums } = app.derived!, now = app.now;
  const moon = chart.moon.uncertain ? chart.moon.possibleSigns.map(s => s.name).join(' or ') : chart.moon.sign.name;
  const sub = `${chart.sun.sign.name} Sun · ${moon} Moon${chart.rising ? ' · ' + chart.rising.sign.name + ' Rising' : ''} · Life Path ${nums.lifePath}`;

  const saveReport = () => app.addJournal(
    'Atlas Report', `Atlas Report · ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    rep.sections.map(s => `${s.h}\n${s.body}`).join('\n\n') + '\n\n' + rep.cards.map(c => `${c.position}: ${c.name} (${c.orientation}) — ${c.meaning}`).join('\n'),
    { recordIds: rep.recordIds, evidence: rep.evidence },
  );

  return (
    <div className="screen fade-up" style={{ gap: 26, maxWidth: 780 }}>
      <button type="button" className="btn-quiet" style={{ alignSelf: 'flex-start' }} onClick={() => app.go('home')}>← Today</button>
      <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
        <div className="eyebrow" style={{ letterSpacing: '0.22em', marginBottom: 12 }}>The Atlas Report · {now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <h1 className="display" style={{ fontSize: 46, lineHeight: 1.05, marginBottom: 12 }}>{p.name}</h1>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>{sub}</div>
      </div>
      {rep.sections.map((s, i) => (
        <section key={s.h} data-evidence={s.evidenceIds.join(' ')}
          style={{ display: 'grid', gridTemplateColumns: '48px minmax(0,1fr)', gap: 16, paddingBottom: 24, borderBottom: '1px solid rgba(201,163,90,0.18)' }}>
          <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: 'var(--gold)', lineHeight: 1.1 }} aria-hidden="true">{ROMAN[i + 1]}</div>
          <div>
            <h2 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: '0 0 8px' }}>{s.h}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, textWrap: 'pretty' }}>{s.body}</p>
          </div>
        </section>
      ))}
      <div>
        <h2 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: '0 0 14px' }}>Three cards for this season</h2>
        <div className="grid-auto" style={{ gap: 14 }}>
          {rep.cards.map(c => (
            <div key={c.position} className="panel stack" style={{ padding: 20, gap: 6 }} data-evidence={c.evidenceId}>
              <div className="eyebrow" style={{ letterSpacing: '0.14em' }}>{c.position}</div>
              <div className="serif" style={{ fontSize: 21, fontWeight: 600 }}>{c.name}</div>
              <div className="label-caps" style={{ fontSize: 11.5, letterSpacing: '0.08em' }}>{c.orientation}</div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-soft)', margin: '4px 0 0' }}>{c.meaning}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <button type="button" className="btn-primary" onClick={saveReport}>Save report to journal</button>
      </div>
      <CalcDetails records={rep.records} evidence={Object.values(rep.evidence)}>
        <p className="note" style={{ margin: '4px 0 0' }}>Each section and card is backed by the calculated facts below. IDs change if any input changes.</p>
      </CalcDetails>
    </div>
  );
}
