"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { SitePreferences } from "@/components/SitePreferences";
import { useLocale } from "@/components/LocaleProvider";

export function SiteHeader() {
  const { pack } = useLocale();
  const megaMenu = useRef<HTMLDetailsElement>(null);
  function closeMegaMenu() {
    if (megaMenu.current) megaMenu.current.open = false;
  }
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="Celestial Atlas home">
          <Image
            className="brand__mark"
            src="/celestialatlas-logo.png"
            alt=""
            width="46"
            height="46"
          />
          <span>
            <strong>Celestial Atlas</strong>
            <small>Ancient sky · personal atlas</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          <details className="mega-nav" ref={megaMenu}>
            <summary>
              Explore <span aria-hidden="true">⌄</span>
            </summary>
            <div className="mega-nav__panel" onClick={closeMegaMenu}>
              <section>
                <p>Today’s sky</p>
                <Link href="/horoscopes">
                  <strong>Daily horoscopes</strong>
                  <small>The day’s celestial weather for every sign</small>
                </Link>
                <Link href="/weekly-readings">
                  <strong>Weekly readings</strong>
                  <small>Your natal chart in the moving sky</small>
                </Link>
              </section>
              <section>
                <p>Your birth chart</p>
                <Link href="/#chart">
                  <strong>Free natal chart</strong>
                  <small>Calculate the sky at your first breath</small>
                </Link>
                <Link href="/samples">
                  <strong>Sample readings</strong>
                  <small>Step inside a complete Celestial Atlas edition</small>
                </Link>
              </section>
              <section>
                <p>Private reports</p>
                <Link href="/reports">
                  <strong>Report collection</strong>
                  <small>Career, recovery and future cycles</small>
                </Link>
                <Link href="/samples/career-purpose">
                  <strong>Career sample</strong>
                  <small>See how natal evidence becomes guidance</small>
                </Link>
                <Link href="/samples/recovery-reflection">
                  <strong>Recovery sample</strong>
                  <small>Grounding and renewal through the natal sky</small>
                </Link>
              </section>
              <section className="mega-nav__feature">
                <p>The celestial rhythm</p>
                <strong>A new reading, every week.</strong>
                <small>
                  Follow the transits as they meet your own natal chart.
                </small>
                <Link href="/weekly-readings">Discover weekly readings →</Link>
              </section>
            </div>
          </details>
          <Link href="/horoscopes">Horoscopes</Link>
          <Link href="/reports" className="site-nav__optional">
            Reports
          </Link>
          <Link href="/account" className="site-nav__account">
            <span className="site-nav__account-full">
              {pack.messages.navigation.library}
            </span>
            <span className="site-nav__account-short">
              {pack.messages.navigation.library}
            </span>
          </Link>
          <SitePreferences />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="eyebrow">Celestial Atlas</p>
          <p>Ancient celestial wisdom, mapped for the moment you arrived.</p>
        </div>
        <div className="site-footer__links">
          <Link href="/reports">Report collection</Link>
          <Link href="/auth/login">Sign in</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>Private by design</span>
        </div>
      </div>
    </footer>
  );
}
