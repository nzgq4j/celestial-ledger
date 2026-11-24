"use client";

import { useState } from "react";
import { fillCopy } from "@/lib/account/member-copy";
import { birthdayNumber, lifePath, personalCycles } from "@/lib/numerology";
import {
  cycleText,
  numberMeaning,
  type NumerologyCopy,
} from "@/lib/numerology/copy";
import type { NumbersPageCopy } from "@/lib/numerology/page-copy";

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  value >= "1800-01-01" &&
  value <= isoToday();

/**
 * Life Path, Birthday and personal cycles. Members arrive with their chart's
 * birth date; visitors enter one, and everything is calculated in the browser.
 */
export function NumbersExplorer({
  copy,
  numbers,
  birthDate,
  localDate,
  chartName,
  locale,
}: {
  copy: NumbersPageCopy;
  numbers: NumerologyCopy;
  birthDate?: string;
  localDate?: string;
  chartName?: string;
  locale: string;
}) {
  const [draft, setDraft] = useState("");
  const [entered, setEntered] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<"lifePath" | "birthday">("lifePath");
  const date = birthDate ?? entered;
  const today = localDate ?? isoToday();

  const values = date
    ? { lifePath: lifePath(date), birthday: birthdayNumber(date) }
    : undefined;
  const cycles = date ? personalCycles(date, today) : undefined;
  const meaning = values ? numberMeaning(numbers, values[selected]) : undefined;
  const monthName = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${today}T12:00:00`));

  return (
    <div className="today2">
      {!birthDate && (
        <form
          className="today2-panel today2-panel--stack numbers-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (validDate(draft)) setEntered(draft);
          }}
        >
          <label className="numbers-form__label">
            {copy.formLabel}
            <input
              type="date"
              className="numbers-form__input"
              value={draft}
              min="1800-01-01"
              max={isoToday()}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="atlas-button"
            disabled={!validDate(draft)}
          >
            {copy.formSubmit}
          </button>
          <p className="today2-meta">{copy.formNote}</p>
        </form>
      )}
      {birthDate && chartName && (
        <p className="today2-meta">
          {fillCopy(copy.fromChart, { name: chartName })}
        </p>
      )}

      {values && meaning && (
        <>
          <div
            className="numbers-picker"
            role="radiogroup"
            aria-label={copy.title}
          >
            {(["lifePath", "birthday"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected === key}
                className="numbers-picker__item"
                onClick={() => setSelected(key)}
              >
                <span className="numbers-picker__value">{values[key]}</span>
                <span className="numbers-picker__label">
                  {key === "lifePath" ? copy.lifePath : copy.birthday}
                </span>
              </button>
            ))}
          </div>
          <section
            className="today2-panel today2-panel--stack"
            aria-live="polite"
          >
            <p className="today2-eyebrow">
              {selected === "lifePath" ? copy.lifePath : copy.birthday}{" "}
              {values[selected]}
            </p>
            <h2 className="today2-title numbers-title">{meaning.title}</h2>
            <p className="today2-meta numbers-keywords">{meaning.keywords}</p>
            <p className="today2-meta">
              {selected === "lifePath"
                ? copy.lifePathFrame
                : copy.birthdayFrame}
            </p>
            <p className="today2-lead">{meaning.core}</p>
          </section>
        </>
      )}

      {cycles && (
        <section aria-label={copy.cyclesKicker} className="today2-grid">
          {[
            {
              label: copy.personalYear,
              value: cycles.personalYear,
              span: today.slice(0, 4),
              text: cycleText(numbers.personalYear, cycles.personalYear),
            },
            {
              label: copy.personalMonth,
              value: cycles.personalMonth,
              span: monthName,
              text: fillCopy(copy.monthTheme, {
                text: cycleText(numbers.personalDay, cycles.personalMonth),
              }),
            },
            {
              label: copy.personalDay,
              value: cycles.personalDay,
              span: copy.today,
              text: cycleText(numbers.personalDay, cycles.personalDay),
            },
          ].map((cycle) => (
            <div key={cycle.label} className="today2-panel today2-panel--stack">
              <p className="today2-eyebrow">{cycle.label}</p>
              <span className="numbers-cycle__value">{cycle.value}</span>
              <span className="today2-meta">{cycle.span}</span>
              <p className="today2-body">{cycle.text}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
