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
          <div className="site-nav__desktop">
            <Link href="/#chart">Birth chart</Link>
            <Link href="/horoscopes">Horoscopes</Link>
            <Link href="/weekly-readings">Weekly</Link>
            <Link href="/reports">Reports</Link>
            <Link href="/samples">Samples</Link>
          </div>
          <details className="mobile-nav" ref={mobileMenu}>
            <summary>
              <span className="mobile-nav__icon" aria-hidden="true" />
              Menu
            </summary>
            <div className="mobile-nav__panel" onClick={closeMobileMenu}>
              <Link href="/#chart">Free birth chart</Link>
              <Link href="/horoscopes">Daily horoscopes</Link>
              <Link href="/weekly-readings">Weekly readings</Link>
              <Link href="/reports">Private reports</Link>
              <Link href="/samples">Sample reports</Link>
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
          <Link href="/method">Our method</Link>
          <Link href="/terms">Terms</Link>
          <span>Private by design</span>
        </div>
      </div>
    </footer>
  );
}
