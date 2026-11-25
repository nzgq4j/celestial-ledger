import { IonItem, IonLabel, IonList, IonNote, IonSearchbar } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useStrings } from '../i18n';
import { loadPlaces, placeLabel, searchPlaces, type Place } from '../engine/places';
import css from './screens.module.css';

/** Searchable birthplace picker over the bundled GeoNames list. */
export function PlaceSearch({ value, onChange, label }: { value: Place | null; onChange: (p: Place) => void; label: string }) {
  const s = useStrings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => { let alive = true; void loadPlaces().then(() => alive && setReady(true)); return () => { alive = false; }; }, []);
  useEffect(() => {
    let alive = true;
    if (query.trim().length < 2) { setResults([]); return; }
    void searchPlaces(query).then(r => alive && setResults(r));
    return () => { alive = false; };
  }, [query]);

  return (
    <div className={css.placeSearch}>
      {value && (
        <IonItem lines="none" className={css.placeChosen}>
          <IonLabel>
            <IonNote>{s.place.selected}</IonNote>
            <h2 className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{placeLabel(value)}</h2>
          </IonLabel>
        </IonItem>
      )}
      <IonSearchbar
        value={query}
        onIonInput={e => setQuery(e.detail.value ?? '')}
        placeholder={ready ? s.place.search : s.place.loading}
        aria-label={label}
        debounce={150}
        showCancelButton="never"
        spellcheck={false}
      />
      {results.length > 0 && (
        <IonList aria-label={s.place.results} lines="full">
          {results.map(p => (
            <IonItem key={p.id} button detail={false} onClick={() => { onChange(p); setQuery(''); setResults([]); }}>
              <IonLabel>
                <h3>{p.name}</h3>
                <p>{[p.region, p.country].filter(Boolean).join(', ')}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      )}
      {query.trim().length >= 2 && ready && results.length === 0 && <p className="small" style={{ margin: '0 16px' }}>{s.place.none}</p>}
    </div>
  );
}
