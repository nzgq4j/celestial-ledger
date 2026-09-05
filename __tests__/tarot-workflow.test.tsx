// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TarotReadingExperience } from "@/components/TarotReadingExperience";
import { TAROT_UI_MESSAGES } from "@/lib/tarot/ui-locales";
import { TAROT_READINGS } from "@/lib/tarot/readings";
import type { TarotDeck } from "@/lib/tarot/types";
vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
const deck: TarotDeck = {
  id: "traditional",
  name: "Traditional",
  tagline: "Test deck",
  minimumPlan: "free",
  active: true,
  accentToken: "gold",
  coverImageUrl: null,
  cardBackImageUrl: null,
};
const copy = TAROT_UI_MESSAGES["en-GB"];
const payload = {
  deck: { id: "traditional", name: "Traditional", cardBackImageUrl: null },
  reading: { id: "daily", name: "Daily Draw" },
  cards: [
    {
      id: "major-0",
      name: "The Fool",
      arcana: "major",
      suit: null,
      number: 0,
      faceImageUrl: null,
      position: "Today",
      orientation: "upright",
      meaning: "Consider a fresh perspective.",
    },
  ],
  narrative: "A reflection.",
  labels: { upright: "Upright", reversed: "Reversed" },
  saveStatus: "guest",
};
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: true })),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function mount(initialDeckId?: string) {
  return render(
    <TarotReadingExperience
      decks={[deck]}
      readings={[...TAROT_READINGS]}
      currentPlan="free"
      locale="en-GB"
      copy={copy}
      initialDeckId={initialDeckId}
    />,
  );
}
describe("tarot progression", () => {
  it("moves focus to each next heading and reveals exactly one draw", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    mount();
    fireEvent.keyDown(screen.getByRole("button", { name: /Traditional/ }), {
      key: "Enter",
    });
    expect(document.activeElement?.id).toBe("tarot-spread-heading");
    expect(screen.queryByText("Celtic Cross")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Select Daily Draw" }));
    expect(document.activeElement?.id).toBe("tarot-shuffle-heading");
    fireEvent.click(
      screen.getByRole("button", { name: copy.shuffleAndReveal }),
    );
    await waitFor(() =>
      expect(document.activeElement?.id).toBe("tarot-reading-heading"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(copy.guestNotice)).toBeTruthy();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(3);
  });
  it("honours an available dashboard deck and ignores an invalid one", () => {
    const result = mount("traditional");
    expect(
      screen.getByRole("heading", { name: copy.chooseSpread }),
    ).toBeTruthy();
    result.unmount();
    mount("not-a-deck");
    expect(screen.getByRole("heading", { name: copy.chooseDeck })).toBeTruthy();
  });
  it("keeps the chosen deck and spread after a failed draw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    mount("traditional");
    fireEvent.click(screen.getByRole("button", { name: "Select Daily Draw" }));
    fireEvent.click(
      screen.getByRole("button", { name: copy.shuffleAndReveal }),
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("button", { name: copy.retry })).toBeTruthy();
    expect(screen.getByText("Traditional · Daily Draw")).toBeTruthy();
  });
});
