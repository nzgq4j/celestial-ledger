"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { SitePreferences } from "@/components/SitePreferences";
import { useLocale } from "@/components/LocaleProvider";
import { signOut } from "@/app/auth/actions";
import type { HeaderIdentity } from "@/lib/auth/header-identity";
import type { AppPlatform } from "@/lib/app-shell/detect";

type NavItem = { key: string; href: string; label: string };

/** Which primary destination the current URL belongs to. */
function activeDestination(pathname: string, view: string | null) {
  if (pathname.startsWith("/account")) {
    if (view === "charts") return "chart";
    if (view === "library") return "library";
    if (view === "settings" || view === "membership") return "account";
    return "today";
  }
  if (pathname.startsWith("/horoscopes")) return "horoscopes";
  if (pathname.startsWith("/tarot")) return "tarot";
  if (pathname.startsWith("/reports") || pathname.startsWith("/samples"))
    return "reports";
  if (pathname.startsWith("/membership")) return "membership";
  if (pathname.startsWith("/clock")) return "clock";
  return "home";
}

function useActiveDestination() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  return activeDestination(pathname, searchParams?.get("view") ?? null);
}

function closeDetails(details: HTMLDetailsElement | null) {
  if (details) details.open = false;
}

function PrimaryNav({ items }: { items: NavItem[] }) {
  const active = useActiveDestination();
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="atlas-nav__link"
          aria-current={active === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function SiteHeader({
  identity,
  tarotEnabled,
}: {
  identity: HeaderIdentity | null;
  tarotEnabled: boolean;
}) {
  const { pack } = useLocale();
  const nav = pack.messages.navigation;
  const identityMenu = useRef<HTMLDetailsElement>(null);
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    closeDetails(identityMenu.current);
    closeDetails(mobileMenu.current);
  }, [pathname]);

  const items: NavItem[] = (
    identity
      ? [
          { key: "today", href: "/account", label: nav.today },
          { key: "chart", href: "/account?view=charts", label: nav.myChart },
          { key: "horoscopes", href: "/horoscopes", label: nav.horoscopes },
          { key: "tarot", href: "/tarot", label: nav.tarot },
          { key: "reports", href: "/reports", label: nav.reports },
        ]
      : [
          { key: "horoscopes", href: "/horoscopes", label: nav.horoscopes },
          { key: "tarot", href: "/tarot", label: nav.tarot },
          { key: "reports", href: "/reports", label: nav.reports },
          { key: "membership", href: "/membership", label: nav.membership },
        ]
  ).filter((item) => tarotEnabled || item.key !== "tarot");

  return (
    <header className="atlas-header" data-app-hidden>
      <div className="atlas-header__inner">
        <Link href="/" className="atlas-brand" aria-label={nav.homeLabel}>
          <Image
            className="atlas-brand__mark"
            src="/celestialatlas-logo.png"
            alt=""
            width="36"
            height="36"
            priority
          />
          <span>Celestial Atlas</span>
        </Link>
        <nav className="atlas-nav" aria-label={nav.primaryLabel}>
          <Suspense
            fallback={items.map((item) => (
              <Link key={item.key} href={item.href} className="atlas-nav__link">
                {item.label}
              </Link>
            ))}
          >
            <PrimaryNav items={items} />
          </Suspense>
        </nav>
        <div className="atlas-header__actions">
          {identity ? (
            <>
              <Link
                href="/membership"
                className="atlas-plan-badge"
                data-plan={identity.plan}
              >
                {identity.plan === "atlas" ? nav.atlasMember : nav.freeMember}
              </Link>
              <details
                className="atlas-menu"
                ref={identityMenu}
                onBlur={(event) => {
                  const nextFocus = event.relatedTarget;
                  if (
                    !(nextFocus instanceof Node) ||
                    !event.currentTarget.contains(nextFocus)
                  )
                    closeDetails(identityMenu.current);
                }}
              >
                <summary className="atlas-avatar" aria-label={nav.identityMenu}>
                  {identity.displayName.slice(0, 1).toUpperCase()}
                </summary>
                <div
                  className="atlas-menu__panel"
                  onClick={() => closeDetails(identityMenu.current)}
                >
                  <p className="atlas-menu__identity">
                    <span>{nav.signedInAs}</span>
                    <strong>{identity.displayName}</strong>
                    <small>{identity.email}</small>
                  </p>
                  <div className="atlas-menu__group atlas-menu__group--compact">
                    <Link href="/horoscopes">{nav.horoscopes}</Link>
                    <Link href="/reports">{nav.reports}</Link>
                  </div>
                  <div className="atlas-menu__group">
                    <Link href="/account?view=library">{nav.library}</Link>
                    <Link href="/account?view=settings">
                      {nav.accountSettings}
                    </Link>
                    <Link href="/account?view=membership">{nav.billing}</Link>
                  </div>
                  <form action={signOut}>
                    <button type="submit">{nav.signOut}</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="atlas-header__signin">
                {nav.signIn}
              </Link>
              <Link href="/#chart" className="atlas-button atlas-button--sm">
                {nav.getMyChart}
              </Link>
              <details
                className="atlas-menu atlas-menu--mobile"
                ref={mobileMenu}
              >
                <summary className="atlas-menu__toggle" aria-label={nav.menu}>
                  <span aria-hidden="true" />
                </summary>
                <div
                  className="atlas-menu__panel"
                  onClick={() => closeDetails(mobileMenu.current)}
                >
                  <div className="atlas-menu__group">
                    {items.map((item) => (
                      <Link key={item.key} href={item.href}>
                        {item.label}
                      </Link>
                    ))}
                    <Link href="/auth/login">{nav.signIn}</Link>
                  </div>
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { pack } = useLocale();
  const copy = pack.messages.footer;
  const nav = pack.messages.navigation;
  return (
    <footer className="atlas-footer" data-app-hidden>
      <span className="atlas-footer__brand">
        <Image src="/celestialatlas-logo.png" alt="" width="26" height="26" />©{" "}
        {new Date().getFullYear()} Celestial Atlas
      </span>
      <nav className="atlas-footer__links" aria-label={copy.trust}>
        <Link href="/journal">{nav.journal}</Link>
        <Link href="/method">{copy.method}</Link>
        <Link href="/privacy">{copy.privacy}</Link>
        <Link href="/terms">{copy.terms}</Link>
        <Link href="/contact">{nav.contact}</Link>
        <SitePreferences />
      </nav>
    </footer>
  );
}

type Tab = { key: string; href: string; icon: string; label: string };

function TabBarLinks({ tabs }: { tabs: Tab[] }) {
  const active = useActiveDestination();
  return (
    <>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className="atlas-tabbar__tab"
          aria-current={active === tab.key ? "page" : undefined}
        >
          <span aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </>
  );
}

/**
 * Bottom tab bar. On the web it replaces the top menu on narrow screens for
 * signed-in members. In the Android app it is always shown (the web header
 * and footer are hidden) and the last tab is Account instead of Library.
 */
export function AppTabBar({
  identity,
  platform,
  tarotEnabled,
}: {
  identity: HeaderIdentity | null;
  platform: AppPlatform;
  tarotEnabled: boolean;
}) {
  const { pack } = useLocale();
  const nav = pack.messages.navigation;
  if (!identity && !platform) return null;
  const tabs: Tab[] = [
    {
      key: "today",
      href: identity ? "/account" : "/",
      icon: "☉︎",
      label: nav.today,
    },
    {
      key: "chart",
      href: identity ? "/account?view=charts" : "/#chart",
      icon: "◎",
      label: nav.chartTab,
    },
    ...(tarotEnabled
      ? [{ key: "tarot", href: "/tarot", icon: "✦", label: nav.tarot }]
      : []),
    platform
      ? {
          key: "account",
          href: identity ? "/account?view=settings" : "/auth/login",
          icon: "◯",
          label: nav.accountTab,
        }
      : {
          key: "library",
          href: "/account?view=library",
          icon: "☰",
          label: nav.libraryTab,
        },
  ];
  return (
    <nav
      className="atlas-tabbar"
      aria-label={nav.appTabsLabel}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
    >
      <Suspense
        fallback={tabs.map((tab) => (
          <Link key={tab.key} href={tab.href} className="atlas-tabbar__tab">
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      >
        <TabBarLinks tabs={tabs} />
      </Suspense>
    </nav>
  );
}
