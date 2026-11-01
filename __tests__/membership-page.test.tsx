// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MembershipExperience } from "@/components/MembershipExperience";
import { LocaleProvider } from "@/components/LocaleProvider";
import { GOOGLE_PLAY_SUBSCRIPTIONS_URL } from "@/lib/membership/plans";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("@/components/native/PlayBillingButton", () => ({
  PlayBillingButton: ({
    interval,
    label,
  }: {
    interval: string;
    label: string;
  }) => (
    <button type="button" data-testid="play-billing" data-interval={interval}>
      {label}
    </button>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

type Props = React.ComponentProps<typeof MembershipExperience>;
const base: Props = {
  signedIn: true,
  subscriptionsEnabled: true,
  availableIntervals: ["month", "year"],
  planId: "free",
  provider: null,
  trialEligible: true,
};
function renderPage(props: Partial<Props> = {}) {
  return render(
    <LocaleProvider>
      <MembershipExperience {...base} {...props} />
    </LocaleProvider>,
  );
}

describe("membership page", () => {
  it("matches the design copy and offers account creation to visitors", () => {
    renderPage({ signedIn: false });
    expect(screen.getByText("Membership").className).toBe("atlas-kicker");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your chart is free. Your daily sky is Atlas.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Your chart")).toBeTruthy();
    expect(screen.getByText("Your sky, daily")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Create free account" })
        .getAttribute("href"),
    ).toBe("/auth/create-account");
    expect(
      screen
        .getByRole("link", { name: "Start 7-day free trial" })
        .getAttribute("href"),
    ).toBe("/auth/create-account");
    expect(
      screen.getByText(
        "All prices in USD. Cancel anytime; your chart and saved readings stay with your free account.",
      ),
    ).toBeTruthy();
  });

  it("switches between monthly and yearly pricing and shows the saving", () => {
    renderPage();
    expect(screen.getByText("$12.99")).toBeTruthy();
    expect(screen.getByText("per month")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Yearly/ }));
    expect(screen.getByText("$99")).toBeTruthy();
    expect(screen.getByText("per year")).toBeTruthy();
    expect(screen.getByText("Save 36%")).toBeTruthy();
    expect(screen.getByText("$8.25 a month, billed yearly")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /Yearly/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("starts a trial checkout for the chosen interval and marks the free plan current", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: "Atlas membership is not yet available." }),
          {
            status: 409,
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    expect(screen.getByText("Your current plan")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Yearly/ }));
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Start 7-day free trial" }),
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/stripe/subscription-checkout",
      expect.objectContaining({
        body: JSON.stringify({ planKey: "premium", interval: "year" }),
      }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Atlas membership is not yet available.",
    );
  });

  it("offers an upgrade without a trial to returning members", () => {
    renderPage({ trialEligible: false });
    expect(
      screen.getByRole("button", { name: "Upgrade to Atlas" }),
    ).toBeTruthy();
    expect(screen.queryByText("Start 7-day free trial")).toBeNull();
  });

  it("disables Atlas until its prices are activated", () => {
    renderPage({ availableIntervals: [] });
    expect(
      (
        screen.getByRole("button", {
          name: "Start 7-day free trial",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen.getByText(/Atlas membership is not yet available/),
    ).toBeTruthy();
  });

  it("sends Stripe members to the billing portal and Play members to Google Play", () => {
    renderPage({ planId: "atlas", provider: "stripe" });
    expect(
      screen.getByRole("button", { name: "Manage membership" }),
    ).toBeTruthy();
    expect(screen.queryByRole("group")).toBeNull();
    cleanup();
    renderPage({ planId: "atlas", provider: "google_play" });
    expect(
      screen
        .getByRole("link", { name: "Manage membership" })
        .getAttribute("href"),
    ).toBe(GOOGLE_PLAY_SUBSCRIPTIONS_URL);
  });

  it("uses Google Play Billing inside the Android app", async () => {
    (window as unknown as { Capacitor: unknown }).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "android",
    };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    const play = await screen.findByTestId("play-billing");
    expect(play.dataset.interval).toBe("month");
    expect(play.textContent).toBe("Start 7-day free trial");
    fireEvent.click(play);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
