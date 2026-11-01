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
import { formatTarotMessage, TAROT_UI_MESSAGES } from "@/lib/tarot/ui-locales";
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
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: true })),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function mount(
  initialDeckId?: string,
  decks: TarotDeck[] = [deck],
  currentPlan: "free" | "premium" = "free",
) {
  return render(
    <TarotReadingExperience
      decks={decks}
      readings={[...TAROT_READINGS]}
      currentPlan={currentPlan}
      locale="en-GB"
      copy={copy}
      initialDeckId={initialDeckId}
    />,
  );
}
const turnCard = (name = "Daily Draw") =>
  screen.getByRole("button", {
    name: formatTarotMessage(copy.turnCard, { name }),
  });
describe("tarot progression", () => {
  it("shows the whole draw face down and keeps revealed cards when switching reflections", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...payload,
        reading: { id: "celtic", name: "Celtic Cross" },
        cards: Array.from({ length: 10 }, (_, index) => ({
          ...payload.cards[0],
          id: `major-${index}`,
          number: index,
          position: `Position ${index + 1}`,
          meaning: `Reflection ${index + 1}`,
        })),
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { container } = mount("traditional", [deck], "premium");
    fireEvent.click(screen.getByRole("button", { name: /Celtic Cross/ }));
    fireEvent.click(turnCard("Celtic Cross"));
    await waitFor(() =>
      expect(screen.getByRole("group", { name: copy.position })).toBeTruthy(),
    );
    expect(
      JSON.parse(fetchMock.mock.calls[0][1].body as string).readingId,
    ).toBe("celtic");
    expect(
      container.querySelectorAll(".tarot-draw-card .tarot-card-back"),
    ).toHaveLength(10);
    expect(
      container
        .querySelector(".tarot-draw-layout")
        ?.getAttribute("data-spread"),
    ).toBe("grid");
    fireEvent.click(screen.getByRole("button", { name: copy.traditionalView }));
    expect(
      container
        .querySelector(".tarot-draw-layout")
        ?.getAttribute("data-spread"),
    ).toBe("celtic");
    expect(screen.getByText(copy.traditionalNote)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: copy.gridView }));
    expect(
      container.querySelector("details.tarot-narrative")?.hasAttribute("open"),
    ).toBe(true);
    expect(screen.queryByText("Reflection 1")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "1. Position 1" }));
    expect(screen.getByText("Reflection 1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: copy.closeCard }));
    fireEvent.click(screen.getByRole("button", { name: "10. Position 10" }));
    expect(screen.getByText("Reflection 10")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: copy.closeCard }));
    expect(
      container.querySelectorAll(".tarot-draw-card .tarot-card-back"),
    ).toHaveLength(8);
    fireEvent.click(
      screen.getByRole("button", {
        name: "1. Position 1: The Fool",
      }),
    );
    expect(screen.getByText("Reflection 1")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("turns the card into the drawn card, focuses its name and draws exactly once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    mount();
    expect(
      screen
        .getByRole("button", { name: /^Daily Draw\s*1 card$/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(turnCard());
    await waitFor(() =>
      expect(document.activeElement?.id).toBe("tarot-reading-heading"),
    );
    expect(document.activeElement?.textContent).toBe("The Fool");
    expect(screen.getByText("Consider a fresh perspective.")).toBeTruthy();
    expect(screen.getByText(/Major Arcana · 0 · Upright/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(copy.guestNotice)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: copy.signInToSave })
        .getAttribute("href"),
    ).toBe("/auth/login");
    fireEvent.click(screen.getByRole("button", { name: copy.reset }));
    expect(turnCard()).toBeTruthy();
  });
  it("shows locked spreads as Atlas links and unlocks them for Atlas members", () => {
    const free = mount();
    const locked = screen.getByRole("link", {
      name: formatTarotMessage(copy.lockedSpreadLabel, {
        name: "Celtic Cross",
      }),
    });
    expect(locked.getAttribute("href")).toBe("/membership");
    expect(locked.textContent).toContain(copy.lockedAtlas);
    expect(screen.getByText(copy.atlasIncluded)).toBeTruthy();
    free.unmount();
    mount(undefined, [deck], "premium");
    expect(screen.getByRole("button", { name: /Celtic Cross/ })).toBeTruthy();
    expect(screen.queryByText(copy.atlasIncluded)).toBeNull();
  });
  it("honours an available dashboard deck and ignores an invalid one", () => {
    const second: TarotDeck = { ...deck, id: "silver", name: "Silver Age" };
    const result = mount("silver", [deck, second]);
    expect(
      screen
        .getByRole("button", { name: "Silver Age" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    result.unmount();
    mount("not-a-deck", [deck, second]);
    expect(
      screen
        .getByRole("button", { name: "Traditional" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
  it("keeps the chosen deck and spread after a failed draw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    mount("traditional");
    fireEvent.click(turnCard());
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("button", { name: copy.retry })).toBeTruthy();
    expect(screen.getByText("Traditional · Daily Draw")).toBeTruthy();
  });
});
