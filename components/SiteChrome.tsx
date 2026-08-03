"use client";

import Link from "next/link";
import Image from "next/image";
import { SitePreferences } from "@/components/SitePreferences";
import { useLocale } from "@/components/LocaleProvider";

export function SiteHeader() {
  const { pack } = useLocale();
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
          <Link href="/#chart" className="site-nav__optional">
            {pack.messages.navigation.chart}
          </Link>
          <Link href="/horoscopes">Horoscopes</Link>
          <Link href="/reports" className="site-nav__optional">
            {pack.messages.navigation.reports}
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
