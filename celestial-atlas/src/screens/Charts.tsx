import {
  IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonContent, IonHeader, IonIcon, IonInput,
  IonItem, IonLabel, IonList, IonModal, IonNote, IonText, IonTitle, IonToolbar, useIonAlert,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useState } from 'react';
import type { Profile } from '../engine/atlas';
import { fill, useStrings } from '../i18n';
import { MAX_EXTRA_CHARTS, type SavedChart } from '../platform/account';
import { useApp } from '../state/store';
import { nameProblem, nameUsable } from '../state/validation';
import { DateTimeFields, TimeZoneCheck, blankDraft, draftFromProfile, draftToProfile, type Draft } from './BirthFields';
import { PlaceSearch } from './PlaceSearch';
import css from './screens.module.css';

/** Charts section of the Account page: the member's own chart and up to 7 more (Atlas+). */
export function Charts() {
  const app = useApp();
  const strings = useStrings();
  const s = strings.charts;
  const [confirm] = useIonAlert();
  const [editing, setEditing] = useState<SavedChart | 'new' | null>(null);
  const signedIn = !!app.account.email;
  const full = app.charts.length >= MAX_EXTRA_CHARTS;
  const when = (p: Profile) => new Date(`${p.date}T12:00:00`).toLocaleDateString(app.locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const where = (p: Profile) => [p.place.name, p.place.country].filter(Boolean).join(', ');

  const add = () => {
    if (!signedIn) { app.openSignIn(); return; }
    if (!app.premium) { app.openPaywall(); return; }
    setEditing('new');
  };
  const askDelete = (c: SavedChart) => void confirm({
    message: fill(s.deleteConfirm, { name: c.profile.name }),
    buttons: [
      { text: strings.common.cancel, role: 'cancel' },
      { text: s.delete, role: 'destructive', handler: () => { void app.deleteChart(c.id); } },
    ],
  });

  return (
    <div className="stack" style={{ gap: 18 }}>
      {app.profile && (
        <IonCard>
          <IonCardHeader><IonCardSubtitle className="eyebrow">{s.yours}</IonCardSubtitle></IonCardHeader>
          <IonList lines="none">
            <IonItem>
              <IonLabel className="ion-text-wrap">
                <h2 className="serif" style={{ fontSize: 21, fontWeight: 600 }}>{app.profile.name}</h2>
                <p>{when(app.profile)} · {where(app.profile)}</p>
              </IonLabel>
              {app.viewing
                ? <IonButton slot="end" fill="outline" size="small" onClick={() => app.viewChart(null)}>{s.view}</IonButton>
                : <IonButton slot="end" fill="clear" size="small" onClick={() => app.setAccountTab('settings')}>{s.editYours}</IonButton>}
            </IonItem>
          </IonList>
        </IonCard>
      )}

      <IonCard>
        <IonCardHeader>
          <div className={css.chartsHead}>
            <IonCardSubtitle className="eyebrow">{s.others}</IonCardSubtitle>
            {app.charts.length > 0 && <IonNote>{fill(s.count, { n: app.charts.length, max: MAX_EXTRA_CHARTS })}</IonNote>}
          </div>
        </IonCardHeader>
        {app.charts.length > 0 && (
          <IonList lines="full">
            {app.charts.map(c => (
              <IonItem key={c.id}>
                <IonLabel className="ion-text-wrap">
                  <h2 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{c.profile.name}</h2>
                  <p>{when(c.profile)} · {where(c.profile)}</p>
                  <div className={css.buttonRow} style={{ marginTop: 6 }}>
                    <IonButton size="small" fill={app.viewing?.id === c.id ? 'solid' : 'outline'} disabled={!app.premium}
                      onClick={() => app.viewChart(c.id)}>{s.view}</IonButton>
                    <IonButton size="small" fill="clear" disabled={!app.premium} onClick={() => setEditing(c)}>{s.edit}</IonButton>
                    <IonButton size="small" fill="clear" color="danger" onClick={() => askDelete(c)}>{s.delete}</IonButton>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
        <IonCardContent className="stack" style={{ gap: 10 }}>
          {app.charts.length === 0 && <p className="small" style={{ margin: 0 }}>{fill(s.empty, { max: MAX_EXTRA_CHARTS })}</p>}
          {app.charts.length > 0 && !app.premium && <p className="small" style={{ margin: 0 }}>{s.locked}</p>}
          {!signedIn && app.account.available && <p className="small" style={{ margin: 0 }}>{s.signInFirst}</p>}
          {signedIn && !app.premium && app.charts.length === 0 && <p className="small" style={{ margin: 0 }}>{fill(s.plusOnly, { max: MAX_EXTRA_CHARTS })}</p>}
          {full
            ? <p className="small" style={{ margin: 0 }}>{fill(s.full, { max: MAX_EXTRA_CHARTS + 1 })}</p>
            : app.account.available && <IonButton onClick={add}>{s.add}</IonButton>}
        </IonCardContent>
      </IonCard>

      <IonModal isOpen={editing !== null} onDidDismiss={() => setEditing(null)} aria-labelledby="chart-form-title">
        {editing !== null && <ChartForm chart={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </IonModal>
    </div>
  );
}

function ChartForm({ chart, onDone }: { chart: SavedChart | null; onDone: () => void }) {
  const app = useApp();
  const strings = useStrings();
  const s = strings.charts;
  const [draft, setDraft] = useState<Draft>(() => (chart ? draftFromProfile(chart.profile) : blankDraft));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const problem = nameProblem(draft.name);

  const submit = async () => {
    const p = nameUsable(draft.name) ? draftToProfile(draft) : null;
    if (!p) { setError(s.invalid); return; }
    setBusy(true); setError(null);
    const ok = await app.saveChart(p, chart?.id);
    setBusy(false);
    if (ok) { app.showToast(s.saved); onDone(); }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle id="chart-form-title">{chart ? s.editTitle : s.addTitle}</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label={strings.common.close} onClick={onDone}><IonIcon aria-hidden="true" slot="icon-only" icon={closeOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form className={css.sheetBody} noValidate onSubmit={e => { e.preventDefault(); void submit(); }}>
          <IonList lines="none" className="field-list">
            <IonItem>
              <IonInput label={s.nameLabel} labelPlacement="stacked" fill="outline" autocomplete="off" value={draft.name}
                onIonInput={e => set({ name: String(e.detail.value ?? '') })} />
            </IonItem>
          </IonList>
          {problem && <IonText color="danger" role="alert"><p className="small-text">{strings.onboarding[problem]}</p></IonText>}
          <DateTimeFields draft={draft} set={set} unknownLabel={s.timeUnknown} />
          <PlaceSearch value={draft.place} onChange={place => set({ place, disambiguation: undefined })} label={strings.profile.changePlace} />
          <TimeZoneCheck draft={draft} set={set} />
          {error && <IonText color="danger" role="alert"><p className="small-text">{error}</p></IonText>}
          <IonButton type="submit" expand="block" disabled={busy} style={{ marginTop: 16 }}>{s.save}</IonButton>
        </form>
      </IonContent>
    </>
  );
}
