"use client";

import { useSyncExternalStore } from "react";

type Greetings = {
  morning: string;
  afternoon: string;
  evening: string;
  fallback: string;
};

const subscribe = (onChange: () => void) => {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
};
// Snapshots are primitives so React can compare them between renders.
const hourSnapshot = () => new Date().getHours();
const daySnapshot = () => new Date().toDateString();
const serverSnapshot = () => null;

/**
 * Greeting and date line for the Today screen. Both depend on the reader's
 * own clock, which the server cannot know, so the server renders a neutral
 * greeting and the browser replaces it after hydration.
 */
export function TodayHeading({
  name,
  locale,
  moonLine,
  greetings,
}: {
  name: string;
  locale: string;
  moonLine?: string;
  greetings: Greetings;
}) {
  const hour = useSyncExternalStore(subscribe, hourSnapshot, serverSnapshot);
  const day = useSyncExternalStore(subscribe, daySnapshot, serverSnapshot);
  const template =
    hour === null
      ? greetings.fallback
      : hour < 5
        ? greetings.evening
        : hour < 12
          ? greetings.morning
          : hour < 18
            ? greetings.afternoon
            : greetings.evening;
  const dateLine =
    day === null
      ? undefined
      : new Intl.DateTimeFormat(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(day));
  const meta = [dateLine, moonLine].filter(Boolean).join(" · ");
  return (
    <div>
      <p className="atlas-meta member-head__meta">{meta || " "}</p>
      <h1 className="atlas-page-title">{template.replace("{name}", name)}</h1>
    </div>
  );
}
