import { IonAccordion, IonAccordionGroup, IonButton, IonCard, IonCardContent, IonIcon, IonItem, IonLabel, IonNote, useIonAlert } from '@ionic/react';
import { cloudDoneOutline, phonePortraitOutline } from 'ionicons/icons';
import { fill, useStrings } from '../i18n';
import { useApp } from '../state/store';
import css from './screens.module.css';

export function Journal() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.journal;
  const [confirm] = useIonAlert();
  const { journal } = app;
  const signedIn = !!app.account.email;

  const askDelete = (id: number) => void confirm({
    message: s.confirmDelete,
    buttons: [
      { text: strings.common.cancel, role: 'cancel' },
      { text: s.delete, role: 'destructive', handler: () => app.deleteJournal(id) },
    ],
  });

  return (
    <div className="screen fade-up" style={{ gap: 18, maxWidth: 780 }}>
      <div className={css.pageHead}>
        <div className="eyebrow">{journal.length === 1 ? s.one : fill(s.many, { n: journal.length })}</div>
        <h1 className="h1">{s.title}</h1>
        {app.account.available && !signedIn && (
          <p className="small" style={{ margin: 0 }}>
            {s.syncHint} <IonButton fill="clear" size="small" onClick={app.openSignIn}>{strings.common.signIn}</IonButton>
          </p>
        )}
      </div>
      {journal.length === 0 && (
        <IonCard className={css.empty}>
          <IonCardContent>
            <div className="serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>{s.emptyTitle}</div>
            <p className="small" style={{ margin: 0 }}>{s.emptyCopy}</p>
          </IonCardContent>
        </IonCard>
      )}
      {journal.length > 0 && (
        <IonAccordionGroup className={css.journalList}>
          {journal.map(e => (
            <IonAccordion key={e.id} value={String(e.id)}>
              <IonItem slot="header" lines="full">
                <IonLabel className="ion-text-wrap">
                  <div className="eyebrow" style={{ letterSpacing: '0.14em', marginBottom: 4 }}>
                    {(s.types as Record<string, string>)[e.type] ?? e.type} · {new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h2 className="serif" style={{ fontSize: 21, fontWeight: 600 }}>{e.title}</h2>
                </IonLabel>
                {app.account.available && (
                  <IonIcon slot="end" icon={e.remoteId ? cloudDoneOutline : phonePortraitOutline} aria-label={e.remoteId ? s.synced : s.local} color="medium" />
                )}
              </IonItem>
              <div slot="content" className={css.journalBody}>
                <div className="body" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{e.body}</div>
                {e.recordIds && e.recordIds.length > 0 && (
                  <IonNote className="note" style={{ overflowWrap: 'anywhere', display: 'block', marginTop: 12 }}>{fill(s.records, { ids: e.recordIds.join(', ') })}</IonNote>
                )}
                <IonButton fill="clear" color="danger" className="link-button" onClick={() => askDelete(e.id)}>{s.delete}</IonButton>
              </div>
            </IonAccordion>
          ))}
        </IonAccordionGroup>
      )}
    </div>
  );
}
