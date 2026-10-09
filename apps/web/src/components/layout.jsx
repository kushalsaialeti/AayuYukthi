import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LanguageSelector } from '../i18n.jsx';
import { track } from '../analytics.js';
export function useDocumentMeta(title, description) {
  useEffect(() => {
    if (title) document.title = `${title} — AayuYukthi`;
    const tag = document.querySelector('meta[name="description"]');
    if (tag && description) tag.setAttribute('content', description);
  }, [title, description]);
}

export function usePageView() {
  const location = useLocation();
  useEffect(() => {
    track('PAGE_VIEWED');
  }, [location.pathname]);
}

export function Navbar({ t, locale, setLocale, user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-mark">Aa</span>
          <span>{t.brand}</span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/how-it-works">{t.nav.how}</NavLink>
          <NavLink to="/services">{t.nav.services}</NavLink>
          <NavLink to="/hospitals">{t.nav.hospitals}</NavLink>
          <NavLink to="/about">{t.nav.about}</NavLink>
          <NavLink to="/contact">{t.nav.contact}</NavLink>
        </nav>
        <div className="nav-cta">
          <LanguageSelector locale={locale} onChange={setLocale} />
          {user ? (
            <Link className="btn btn-secondary" to="/app">{t.myAccount}</Link>
          ) : (
            <Link className="btn btn-secondary" to="/login" onClick={() => track('CTA_CLICKED', { cta: 'login' })}>{t.login}</Link>
          )}
          <Link className="btn btn-primary" to="/request-care" onClick={() => track('CTA_CLICKED', { cta: 'request_care' })}>{t.requestCare}</Link>
        </div>

        {/* Mobile quick action bar and hamburger button */}
        <div className="nav-mobile-bar">
          <Link
            className="btn btn-primary btn-sm nav-mobile-quick-cta"
            to="/request-care"
            onClick={() => {
              track('CTA_CLICKED', { cta: 'request_care' });
              setMobileMenuOpen(false);
            }}
          >
            {t.requestCare}
          </Link>
          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="nav-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Menu */}
      <div className={`nav-mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}>
        <nav className="nav-mobile-links" aria-label="Mobile Primary">
          <NavLink to="/how-it-works" onClick={() => setMobileMenuOpen(false)}>{t.nav.how}</NavLink>
          <NavLink to="/services" onClick={() => setMobileMenuOpen(false)}>{t.nav.services}</NavLink>
          <NavLink to="/hospitals" onClick={() => setMobileMenuOpen(false)}>{t.nav.hospitals}</NavLink>
          <NavLink to="/about" onClick={() => setMobileMenuOpen(false)}>{t.nav.about}</NavLink>
          <NavLink to="/contact" onClick={() => setMobileMenuOpen(false)}>{t.nav.contact}</NavLink>
        </nav>

        <div className="nav-mobile-actions">
          <div className="nav-mobile-lang-row">
            <span className="nav-mobile-lang-label">Language:</span>
            <LanguageSelector locale={locale} onChange={setLocale} />
          </div>
          {user ? (
            <Link
              className="btn btn-secondary nav-mobile-btn"
              to="/app"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t.myAccount}
            </Link>
          ) : (
            <Link
              className="btn btn-secondary nav-mobile-btn"
              to="/login"
              onClick={() => {
                track('CTA_CLICKED', { cta: 'login' });
                setMobileMenuOpen(false);
              }}
            >
              {t.login}
            </Link>
          )}
          <Link
            className="btn btn-primary nav-mobile-btn"
            to="/request-care"
            onClick={() => {
              track('CTA_CLICKED', { cta: 'request_care' });
              setMobileMenuOpen(false);
            }}
          >
            {t.requestCare}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer({ t, contact }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <strong>{t.brand}</strong>
          <p>{t.footerTagline}</p>
        </div>
        <nav aria-label="Footer">
          <Link to="/how-it-works">{t.nav.how}</Link>
          <Link to="/services">{t.nav.services}</Link>
          <Link to="/hospitals">{t.nav.hospitals}</Link>
          <Link to="/about">{t.nav.about}</Link>
          <Link to="/contact">{t.nav.contact}</Link>
        </nav>
        <div>
          {contact?.phone && <p>{contact.phone}</p>}
          {contact?.email && <p>{contact.email}</p>}
          {contact?.address_en && <p>{contact.address_en}</p>}
        </div>
      </div>
      <div className="container footer-base">
        <small>© {new Date().getFullYear()} {t.brand}. {t.rights}</small>
      </div>
    </footer>
  );
}

export function Loading({ t }) {
  return (
    <div className="container" aria-busy="true" aria-live="polite">
      <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: '55%' }} />
      <span className="sr-only">{t.loading}</span>
    </div>
  );
}

export function LoadError({ t, onRetry }) {
  return (
    <div className="container">
      <div className="card">
        <p>{t.loadError}</p>
        <button className="btn btn-secondary" onClick={onRetry}>{t.tryAgain}</button>
      </div>
    </div>
  );
}

export function Empty({ message, action }) {
  return (
    <div className="card empty">
      <p>{message}</p>
      {action}
    </div>
  );
}

export function FinalCta({ t }) {
  return (
    <section className="final-cta">
      <div className="container">
        <h2>{t.finalCtaTitle}</h2>
        <p>{t.finalCtaText}</p>
        <Link className="btn btn-primary" to="/request-care">{t.requestCare}</Link>
      </div>
    </section>
  );
}
