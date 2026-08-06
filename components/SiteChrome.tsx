"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { SitePreferences } from "@/components/SitePreferences";
import { useLocale } from "@/components/LocaleProvider";

export function SiteHeader() {
  const { pack } = useLocale();
  const mobileMenu = useRef<HTMLDetailsElement>(null);

  function closeMobileMenu() {
    if (mobileMenu.current) mobileMenu.current.open = false;
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
            <Link href="/weekly-readings">
              {pack.messages.navigation.weekly}
            </Link>
            <Link href="/reports">{pack.messages.navigation.reports}</Link>
            <Link href="/membership">
              {pack.messages.navigation.membership}
            </Link>
            <Link href="/samples">{pack.messages.navigation.samples}</Link>
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
              <Link href="/weekly-readings">
                {pack.messages.navigation.weeklyReadings}
              </Link>
              <Link href="/reports">
                {pack.messages.navigation.privateReports}
              </Link>
              <Link href="/membership">
                {pack.messages.navigation.membershipPlans}
              </Link>
              <Link href="/samples">
                {pack.messages.navigation.sampleReports}
              </Link>
              <Link href="/journal">{pack.messages.navigation.journal}</Link>
              <Link href="/account">{pack.messages.navigation.library}</Link>
            </div>
          </details>
          <Link href="/account" className="site-nav__account">
            {pack.messages.navigation.library}
          </Link>
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
              {titleLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
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
