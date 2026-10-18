import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LanguageSelector } from '../../i18n.jsx';
import { track } from '../../analytics.js';

export function Header({ t, locale, setLocale, user, logoUrl }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-close mobile drawer when window resizes to laptop/desktop width (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="pub-header">
      <div className="pub-container pub-header-inner">
        {/* Left Side: Traditional 3-line Hamburger Button (Mobile only) + Brand Logo */}
        <div className="pub-header-left">
          <button
            type="button"
            className="pub-mobile-toggle-btn"
            aria-label={menuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>

          <Link to="/" className="pub-brand" aria-label={t.brand} onClick={() => setMenuOpen(false)}>
            {logoUrl ? (
              <img src={logoUrl} alt={`${t.brand} logo`} />
            ) : (
              <span className="pub-brand-badge" aria-hidden="true">
                A
              </span>
            )}
            <span>{t.brand}</span>
          </Link>
        </div>

        {/* Primary Desktop Nav: Core care journeys only (About & Contact moved to dedicated locations) */}
        <nav className="pub-nav" aria-label="Primary Desktop Navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.navHome ?? 'Home'}
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.how}
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.services}
          </NavLink>
          <NavLink to="/hospitals" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.hospitals}
          </NavLink>
        </nav>

        {/* Header Right Actions */}
        <div className="pub-header-actions">
          {/* Quick Help & Contact Access for Desktop */}
          <Link
            to="/contact"
            className="pub-helpline-pill"
            title="Helpline & Contact Desk"
            onClick={() => track('CTA_CLICKED', { cta: 'header_helpline' })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">
              call
            </span>
            <span className="pub-helpline-text">Help &amp; Contact</span>
          </Link>

          {/* Language Selector (Desktop / Laptop) */}
          <div className="pub-desktop-lang">
            <LanguageSelector locale={locale} onChange={setLocale} />
          </div>

          {/* User Auth / Dashboard Button */}
          {user ? (
            <Link
              to="/app"
              className="pub-user-badge"
              aria-label={t.myAccount || 'Dashboard'}
              title="Return to Care Portal"
            >
              <span className="pub-user-initial" aria-hidden="true">
                {(user.full_name ?? user.email ?? 'A').slice(0, 1).toUpperCase()}
              </span>
              <span className="pub-user-label">Dashboard</span>
            </Link>
          ) : (
            <Link
              className="pub-login"
              to="/login"
              onClick={() => track('CTA_CLICKED', { cta: 'login' })}
            >
              {t.login}
            </Link>
          )}

          {/* Primary Request Care Button */}
          <Link
            className="pub-btn pub-header-cta"
            to="/request-care"
            onClick={() => track('CTA_CLICKED', { cta: 'request_care' })}
          >
            <span>{t.requestCare}</span>
          </Link>
        </div>
      </div>

      {/* Mobile Backdrop (Strictly Mobile Screens < 1024px) */}
      {menuOpen && (
        <div
          className="pub-mobile-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Traditional Left Side Mobile Sidebar (Strictly Mobile Screens < 1024px) */}
      <aside className={`pub-mobile-sidebar ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="pub-mobile-sidebar-inner">
          <div className="pub-mobile-sidebar-head">
            <Link to="/" className="pub-brand" onClick={() => setMenuOpen(false)}>
              {logoUrl ? <img src={logoUrl} alt={t.brand} /> : <span>{t.brand}</span>}
            </Link>
            <button
              type="button"
              className="pub-mobile-close-btn"
              aria-label="Close sidebar"
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="pub-mobile-nav" aria-label="Mobile Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `pub-mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">home</span>
              <span>{t.navHome ?? 'Home'}</span>
            </NavLink>

            <NavLink
              to="/how-it-works"
              className={({ isActive }) => `pub-mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">route</span>
              <span>{t.nav.how}</span>
            </NavLink>

            <NavLink
              to="/services"
              className={({ isActive }) => `pub-mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">medical_services</span>
              <span>{t.nav.services}</span>
            </NavLink>

            <NavLink
              to="/hospitals"
              className={({ isActive }) => `pub-mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">local_hospital</span>
              <span>{t.nav.hospitals}</span>
            </NavLink>

            {/* About and Contact cleanly accessible in mobile sidebar */}
            <NavLink
              to="/about"
              className={({ isActive }) => `pub-mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">info</span>
              <span>{t.nav.about}</span>
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) => `pub-mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="material-symbols-outlined">support_agent</span>
              <span>{t.nav.contact} &amp; Helpline</span>
            </NavLink>
          </nav>

          {/* Mobile Language Selector & Direct Dial */}
          <div className="pub-mobile-utility">
            <div className="pub-mobile-lang-row">
              <span className="pub-mobile-util-label">Language:</span>
              <LanguageSelector locale={locale} onChange={setLocale} />
            </div>

            <a href="tel:180022982273" className="pub-mobile-call-row">
              <span className="material-symbols-outlined">call</span>
              <div>
                <strong>Toll-Free Helpline</strong>
                <span>1800-AAYU-CARE (Mon–Sat, 8am–8pm)</span>
              </div>
            </a>
          </div>

          {/* Mobile Footer CTAs */}
          <div className="pub-mobile-actions">
            {user ? (
              <Link
                to="/app"
                className="pub-btn secondary"
                style={{ width: '100%' }}
                onClick={() => setMenuOpen(false)}
              >
                Go to Care Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="pub-btn secondary"
                style={{ width: '100%' }}
                onClick={() => setMenuOpen(false)}
              >
                {t.login} / Register
              </Link>
            )}

            <Link
              to="/request-care"
              className="pub-btn"
              style={{ width: '100%' }}
              onClick={() => setMenuOpen(false)}
            >
              {t.requestCare}
            </Link>
          </div>
        </div>
      </aside>
    </header>
  );
}
