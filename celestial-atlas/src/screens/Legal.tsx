import { IonCard, IonCardContent } from '@ionic/react';
import { useStrings } from '../i18n';
import css from './screens.module.css';

export function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const strings = useStrings();
  const doc = strings.legal[kind];
  return (
    <div className="screen fade-up" style={{ gap: 18, maxWidth: 720 }}>
      <div className={css.pageHead}>
        <div className="eyebrow">{strings.legal.kicker}</div>
        <h1 className="h1">{doc.title}</h1>
        <p className="small" style={{ margin: 0 }}>{doc.updated}</p>
      </div>
      <IonCard>
        <IonCardContent className="stack" style={{ gap: 18 }}>
          {doc.sections.map(sec => (
            <section key={sec.h}>
              <h2 className="serif" style={{ fontSize: 21, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }}>{sec.h}</h2>
              <p className="body" style={{ margin: 0 }}>{sec.p}</p>
            </section>
          ))}
        </IonCardContent>
      </IonCard>
    </div>
  );
}
