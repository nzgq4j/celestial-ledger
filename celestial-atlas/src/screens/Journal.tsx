import { useApp } from '../state/store';
import css from './screens.module.css';

export function Journal() {
  const app = useApp();
  const { journal, ui } = app;
  return (
    <div className="screen fade-up" style={{ gap: 22, maxWidth: 780 }}>
      <div className={css.pageHead}>
        <div className="eyebrow">{journal.length === 1 ? '1 saved reading' : `${journal.length} saved readings`}</div>
        <h1 className="h1">Journal</h1>
      </div>
      {journal.length === 0 && (
        <div style={{ border: '1px dashed rgba(201,163,90,0.4)', borderRadius: 6, padding: '40px 28px', textAlign: 'center' }}>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Nothing saved yet</div>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0 }}>Tap “Save to journal” on any horoscope, number, card or report to keep it here.</p>
        </div>
      )}
      <div className="stack" style={{ gap: 10 }}>
        {journal.map(e => {
          const open = ui.openEntry === e.id;
          const bodyId = `entry-${e.id}`;
          return (
            <div key={e.id} style={{ background: 'var(--panel)', border: '1px solid rgba(201,163,90,0.25)', borderRadius: 6 }}>
              <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => app.setUi({ openEntry: open ? null : e.id })}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, background: 'none', border: 'none', padding: '18px 20px', textAlign: 'left', minHeight: 64 }}>
                <div>
                  <div className="eyebrow" style={{ letterSpacing: '0.14em', marginBottom: 4 }}>
                    {e.type} · {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="serif" style={{ fontSize: 21, fontWeight: 600 }}>{e.title}</div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 18 }} aria-hidden="true">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div id={bodyId} className="stack" style={{ padding: '0 20px 20px', gap: 14 }}>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-line' }}>{e.body}</div>
                  {e.recordIds && e.recordIds.length > 0 && (
                    <div className="note" style={{ overflowWrap: 'anywhere' }}>Records: {e.recordIds.join(', ')}</div>
                  )}
                  <button type="button" className="btn-danger" style={{ fontSize: 13 }} onClick={() => app.deleteJournal(e.id)}>Delete entry</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
