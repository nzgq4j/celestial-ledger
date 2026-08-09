"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { SitePreferences } from "@/components/SitePreferences";
import { useLocale } from "@/components/LocaleProvider";
import { signOut } from "@/app/auth/actions";
import type { HeaderIdentity } from "@/lib/auth/header-identity";

export function SiteHeader({
  identity,
  tarotEnabled,
}: {
  identity: HeaderIdentity | null;
  tarotEnabled: boolean;
}) {
  const { pack } = useLocale();
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const membershipMenu = useRef<HTMLDetailsElement>(null);

  function closeMobileMenu() {
    if (mobileMenu.current) mobileMenu.current.open = false;
  }

  function closeMembershipMenu() {
    if (membershipMenu.current) membershipMenu.current.open = false;
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          href="/"
          className="brand"
          aria-label={pack.messages.navigation.homeLabel}
        >
          <Image
            className="brand__mark"
            src="/celestialatlas-logo.png"
            alt=""
            width="46"
            height="46"
          />
          <span>
            <strong>Celestial Atlas</strong>
            <small>{pack.messages.navigation.tagline}</small>
          </span>
        </Link>
        <nav
          className="site-nav"
          aria-label={pack.messages.navigation.primaryLabel}
        >
          <div className="site-nav__desktop">
            <Link href="/#chart">{pack.messages.navigation.birthChart}</Link>
            <Link href="/horoscopes">
              {pack.messages.navigation.horoscopes}
            </Link>
            {tarotEnabled && (
              <Link href="/tarot">{pack.messages.navigation.tarot}</Link>
            )}
            <Link href="/reports">{pack.messages.navigation.reports}</Link>
            <details
              className="site-nav-group"
              ref={membershipMenu}
              onPointerLeave={closeMembershipMenu}
              onBlur={(event) => {
                const nextFocus = event.relatedTarget;
                if (
                  !(nextFocus instanceof Node) ||
                  !event.currentTarget.contains(nextFocus)
                ) {
                  closeMembershipMenu();
                }
              }}
            >
              <summary>
                {pack.messages.navigation.membership}
                <span aria-hidden="true" />
              </summary>
              <div
                className="site-nav-group__menu"
                onClick={closeMembershipMenu}
              >
                <Link href="/membership">
                  <strong>{pack.messages.navigation.membership}</strong>
                  <small>Plans and benefits</small>
                </Link>
                <Link href="/weekly-readings">
                  <strong>{pack.messages.navigation.weekly}</strong>
                  <small>Your seven-day sky</small>
                </Link>
                <Link href="/samples">
                  <strong>{pack.messages.navigation.samples}</strong>
                  <small>Explore complete editions</small>
                </Link>
              </div>
            </details>
            <Link href="/journal">{pack.messages.navigation.journal}</Link>
          </div>
          <details className="mobile-nav" ref={mobileMenu}>
            <summary>
              <span className="mobile-nav__icon" aria-hidden="true" />
              {pack.messages.navigation.menu}
            </summary>
            <div className="mobile-nav__panel" onClick={closeMobileMenu}>
              <Link href="/#chart">{pack.messages.navigation.birthChart}</Link>
              <Link href="/horoscopes">
                {pack.messages.navigation.dailyHoroscopes}
              </Link>
              {tarotEnabled && (
                <Link href="/tarot">{pack.messages.navigation.tarot}</Link>
              )}
              <Link href="/reports">
                {pack.messages.navigation.privateReports}
              </Link>
              <div className="mobile-nav__group">
                <span>{pack.messages.navigation.membership}</span>
                <Link href="/membership">
                  {pack.messages.navigation.membershipPlans}
                </Link>
                <Link href="/weekly-readings">
                  {pack.messages.navigation.weeklyReadings}
                </Link>
                <Link href="/samples">
                  {pack.messages.navigation.sampleReports}
                </Link>
              </div>
              <Link href="/journal">{pack.messages.navigation.journal}</Link>
              {identity ? (
                <div className="mobile-nav__group mobile-nav__identity">
                  <span>
                    {pack.messages.navigation.signedInAs} {identity.displayName}
                  </span>
                  <Link href="/account">
                    {pack.messages.navigation.dashboard}
                  </Link>
                  <Link href="/account#account-settings">
                    {pack.messages.navigation.accountSettings}
                  </Link>
                  <Link href="/account#billing">
                    {pack.messages.navigation.billing}
                  </Link>
                  <form action={signOut}>
                    <button type="submit">
                      {pack.messages.navigation.signOut}
                    </button>
                  </form>
                </div>
              ) : (
                <Link href="/auth/login">
                  {pack.messages.navigation.signIn}
                </Link>
              )}
            </div>
          </details>
          {identity ? (
            <details className="site-nav-group site-nav-identity">
              <summary aria-label={pack.messages.navigation.identityMenu}>
                <i className="site-nav-identity__avatar" aria-hidden="true">
                  {identity.displayName.slice(0, 1).toUpperCase()}
                </i>
                <strong>{identity.displayName}</strong>
                <span aria-hidden="true" />
              </summary>
              <div className="site-nav-group__menu">
                <Link href="/account">
                  <strong>{pack.messages.navigation.dashboard}</strong>
                  <small>{pack.messages.navigation.library}</small>
                </Link>
                <Link href="/account#account-settings">
                  <strong>{pack.messages.navigation.accountSettings}</strong>
                  <small>{identity.email}</small>
                </Link>
                <Link href="/account#billing">
                  <strong>{pack.messages.navigation.billing}</strong>
                  <small>{pack.messages.navigation.membership}</small>
                </Link>
                <form action={signOut}>
                  <button type="submit">
                    <strong>{pack.messages.navigation.signOut}</strong>
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link href="/auth/login" className="site-nav__account">
              {pack.messages.navigation.signIn}
            </Link>
          )}
          <SitePreferences />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { pack } = useLocale();
  const copy = pack.messages.footer;
  const navigation = pack.messages.navigation;
  const titleLines = copy.title.split(/(?<=\.)\s+/);
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__lead">
          <Image src="/celestialatlas-logo.png" alt="" width="58" height="58" />
          <div>
            <h2>
              {titleLines.map((line) => {
                const parts = line.split(/(\bchart\b)/i);
                return (
                  <span key={line}>
                    {parts.map((part, index) =>
                      /^chart$/i.test(part) ? (
                        <strong
                          className="site-footer__title-accent"
                          key={`${part}-${index}`}
                        >
                          {part}
                        </strong>
                      ) : (
                        part
                      ),
                    )}
                  </span>
                );
              })}
            </h2>
            <p>{copy.kicker}</p>
            <p>{copy.description}</p>
          </div>
          <Link href="/#chart" className="site-footer__chart-link">
            {copy.chartAction}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="site-footer__directory">
          <nav aria-labelledby="footer-explore">
            <h3 id="footer-explore">{copy.explore}</h3>
            <Link href="/horoscopes">{navigation.dailyHoroscopes}</Link>
            <Link href="/weekly-readings">{navigation.weeklyReadings}</Link>
            <Link href="/journal">{navigation.journal}</Link>
            <Link href="/samples">{navigation.sampleReports}</Link>
          </nav>
          <nav aria-labelledby="footer-atlas">
            <h3 id="footer-atlas">{copy.yourAtlas}</h3>
            <Link href="/account">{navigation.library}</Link>
            <Link href="/#chart">{navigation.birthChart}</Link>
            <Link href="/reports">{copy.collection}</Link>
            <Link href="/membership">{navigation.membershipPlans}</Link>
            <Link href="/auth/login">{copy.signIn}</Link>
          </nav>
          <nav aria-labelledby="footer-trust">
            <h3 id="footer-trust">{copy.trust}</h3>
            <Link href="/method">{copy.method}</Link>
            <Link href="/privacy">{copy.privacy}</Link>
            <Link href="/terms">{copy.terms}</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <div className="site-footer__language">
            <h3>{copy.language}</h3>
            <p>{copy.languageCopy}</p>
            <SitePreferences />
          </div>
        </div>

        <div className="site-footer__seal" aria-hidden="true">
          <i />
          <Image src="/celestialatlas-logo.png" alt="" width="92" height="92" />
          <i />
        </div>

        <div className="site-footer__colophon">
          <span>© {new Date().getFullYear()} Celestial Atlas</span>
          <span>{copy.rights}</span>
          <span>33.20430, -87.52750</span>
        </div>
      </div>
    </footer>
  );
}
