"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

export type ChartDataRow = {
  key: string;
  glyph: string;
  glyphLabel?: string;
  name: string;
  value: string;
  /** Spoken alternative when `value` contains glyphs. */
  valueLabel?: string;
  note: string;
};

export type ChartDataTab = {
  id: string;
  label: string;
  rows: ChartDataRow[];
  empty: string;
};

/** Planets / Houses / Aspects table for the My chart screen (WAI-ARIA tabs). */
export function ChartDataTabs({
  tabs,
  label,
}: {
  tabs: ChartDataTab[];
  label: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : delta
            ? (index + delta + tabs.length) % tabs.length
            : undefined;
    if (target === undefined) return;
    event.preventDefault();
    setActive(tabs[target].id);
    tabRefs.current[target]?.focus();
  }

  return (
    <div className="chart-table">
      <div className="chart-table__tabs" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-controls={`${baseId}-panel-${tab.id}`}
            aria-selected={active === tab.id}
            tabIndex={active === tab.id ? 0 : -1}
            className="chart-table__tab"
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={active !== tab.id}
          tabIndex={0}
          className="chart-table__panel"
        >
          {tab.rows.length ? (
            <ul className="chart-table__rows">
              {tab.rows.map((row) => (
                <li className="chart-table__row" key={row.key}>
                  <span
                    className="chart-table__glyph"
                    aria-hidden={row.glyphLabel ? undefined : true}
                    aria-label={row.glyphLabel}
                    role={row.glyphLabel ? "img" : undefined}
                  >
                    {row.glyph}
                  </span>
                  <span className="chart-table__name">{row.name}</span>
                  <span className="chart-table__value">
                    {row.valueLabel ? (
                      <>
                        <span aria-hidden="true">{row.value}</span>
                        <span className="member-sr">{row.valueLabel}</span>
                      </>
                    ) : (
                      row.value
                    )}
                  </span>
                  <span className="chart-table__note">{row.note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chart-table__empty">{tab.empty}</p>
          )}
        </div>
      ))}
    </div>
  );
}
