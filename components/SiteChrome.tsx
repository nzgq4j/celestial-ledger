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
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="eyebrow">Celestial Atlas</p>
          <p>{pack.messages.footer.description}</p>
        </div>
        <div className="site-footer__links">
          <Link href="/reports">{pack.messages.footer.collection}</Link>
          <Link href="/auth/login">{pack.messages.footer.signIn}</Link>
          <Link href="/privacy">{pack.messages.footer.privacy}</Link>
          <Link href="/method">{pack.messages.footer.method}</Link>
          <Link href="/terms">{pack.messages.footer.terms}</Link>
          <span>{pack.messages.footer.privateByDesign}</span>
        </div>
      </div>
    </footer>
  );
}
