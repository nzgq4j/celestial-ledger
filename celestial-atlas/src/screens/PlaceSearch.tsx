import { useEffect, useId, useState } from 'react';
import { loadPlaces, placeLabel, searchPlaces, type Place } from '../engine/places';
import css from './screens.module.css';

/** Searchable birthplace picker over the bundled GeoNames list. */
export function PlaceSearch({ value, onChange, label }: { value: Place | null; onChange: (p: Place) => void; label: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [ready, setReady] = useState(false);
  const listId = useId();

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
        <div className={css.placeChosen}>
          <span className="small">Selected</span>
          <span className={css.placeChosenName}>{placeLabel(value)}</span>
        </div>
      )}
      <label className="field">{label}
        <input className="input" type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder={ready ? 'Start typing a city' : 'Loading cities…'} autoComplete="off" spellCheck={false}
          role="combobox" aria-expanded={results.length > 0} aria-controls={listId} aria-autocomplete="list" />
      </label>
      {results.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Matching cities" className={css.placeList}>
          {results.map(p => (
            <li key={p.id} role="option" aria-selected={value?.id === p.id}>
              <button type="button" className={css.placeOption} onClick={() => { onChange(p); setQuery(''); setResults([]); }}>
                <span>{p.name}</span>
                <span className="small">{[p.region, p.country].filter(Boolean).join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && ready && results.length === 0 && <p className="small" style={{ margin: 0 }}>No matching city. Try a nearby larger city.</p>}
    </div>
  );
}
