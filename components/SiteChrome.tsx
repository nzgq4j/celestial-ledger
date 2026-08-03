import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="Celestial Atlas home">
          <span className="brand__mark" aria-hidden="true">
            <i />
          </span>
          <span>
            <strong>Celestial Atlas</strong>
            <small>Calculated reflection</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#chart">Chart</Link>
          <Link href="/reports">Reports</Link>
          <Link href="/account" className="site-nav__account">
            Private library
          </Link>
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
          <p>Astrology for reflection, grounded in reproducible calculation.</p>
        </div>
        <div className="site-footer__links">
          <Link href="/reports">Report collection</Link>
          <Link href="/auth/login">Sign in</Link>
          <span>Private by design</span>
        </div>
      </div>
    </footer>
  );
}
