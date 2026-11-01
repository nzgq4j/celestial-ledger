// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import HoroscopeApp from "@/components/HoroscopeApp";
import { LocaleProvider } from "@/components/LocaleProvider";
import { sampleBirthInput, sampleChart } from "@/lib/samples";
import { sampleNatalInterpretation } from "@/lib/sample-reports/natal-chart";
import type { NatalChart } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

let chart: NatalChart;
beforeAll(async () => {
  chart = await sampleChart();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockApis() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith("/api/geocode"))
      return Response.json({ places: [sampleBirthInput.place] });
    if (url === "/api/chart") return Response.json({ chart });
    if (url === "/api/interpret")
      return Response.json({
        interpretation: sampleNatalInterpretation,
        provenance: { modelVersion: "model", promptVersion: "prompt" },
      });
    if (url === "/api/stripe/anonymous-subscription-checkout")
      return Response.json(
        { error: "stop", body: init?.body },
        { status: 400 },
      );
    return Response.json({}, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mount(account?: { displayName: string }) {
  return render(
    <LocaleProvider>
      <HoroscopeApp account={account} />
    </LocaleProvider>,
  );
}

async function calculate() {
  fireEvent.change(screen.getByLabelText("Birth date"), {
    target: { value: sampleBirthInput.date },
  });
  fireEvent.change(screen.getByLabelText("Birth time"), {
    target: { value: sampleBirthInput.time },
  });
  fireEvent.change(screen.getByLabelText("Birthplace"), {
    target: { value: "Tuscaloosa" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  fireEvent.click(await screen.findByRole("radio", { name: /Tuscaloosa/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Email me/ }));
  fireEvent.click(screen.getByRole("button", { name: "Calculate my chart" }));
  await screen.findByRole("heading", { name: "Your natal chart" });
}

describe("home chart calculator", () => {
  it("keeps the calculator in the hero and shows the resolved birthplace", async () => {
    mockApis();
    mount();
    const form = document.getElementById("chart");
    expect(form?.querySelector("h2")?.textContent).toBe("Your birth chart");
    expect(within(form!).getByText("Step 1 of 2")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Birthplace"), {
      target: { value: "Tuscaloosa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Tuscaloosa/ }));
    expect(screen.getByRole("status").textContent).toContain(
      sampleBirthInput.place.timeZone,
    );
    expect(screen.getByRole("link", { name: /Compare plans/ })).toBeTruthy();
  });

  it("presents the Big Three, wheel, tabbed tables and interpretation", async () => {
    mockApis();
    mount();
    await calculate();
    for (const label of ["Sun", "Moon", "Rising"])
      expect(screen.getByRole("heading", { name: label })).toBeTruthy();
    expect(
      screen.getByRole("img", { name: /Your natal chart, Sun/ }),
    ).toBeTruthy();
    const planets = screen.getByRole("tab", { name: "Planets" });
    expect(planets.getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(planets, { key: "ArrowRight" });
    expect(
      screen.getByRole("tab", { name: "Houses" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByRole("tabpanel").querySelectorAll("li")).toHaveLength(
      12,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Aspects" }));
    expect(
      screen.getByRole("tabpanel").querySelectorAll("li").length,
    ).toBeGreaterThan(0);
    await screen.findByRole("heading", { name: "Your chart, in words." });
    await waitFor(() =>
      expect(document.querySelectorAll(".natal-prose__section").length).toBe(9),
    );
  });

  it("continues anonymous visitors to Atlas checkout, never a retired plan", async () => {
    const fetchMock = mockApis();
    mount();
    await calculate();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "reader@example.com" },
    });
    const atlas = await screen.findByRole("button", {
      name: "Continue with Atlas",
    });
    await waitFor(() => expect(atlas.hasAttribute("disabled")).toBe(false));
    fireEvent.click(atlas);
    await waitFor(
      () =>
        expect(
          fetchMock.mock.calls.some(
            ([url]) => url === "/api/stripe/anonymous-subscription-checkout",
          ),
        ).toBe(true),
      // The reCAPTCHA helper waits up to five seconds for its script.
      { timeout: 7000 },
    );
    const [, init] = fetchMock.mock.calls.find(
      ([url]) => url === "/api/stripe/anonymous-subscription-checkout",
    )!;
    expect(JSON.parse(init!.body as string).planKey).toBe("premium");
  }, 15_000);

  it("gives signed-in readers a link to Today and hides the marketing sections", () => {
    mockApis();
    mount({ displayName: "Maya" });
    expect(
      screen.getByRole("link", { name: /Open Today/ }).getAttribute("href"),
    ).toBe("/account");
    expect(screen.queryByRole("link", { name: /Compare plans/ })).toBeNull();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });
});
