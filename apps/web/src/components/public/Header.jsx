import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LanguageSelector } from '../../i18n.jsx';
import { track } from '../../analytics.js';

export function Header({ t, locale, setLocale, user, logoUrl }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu whenever route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-close mobile dropdown when window resizes to desktop width (>= 1024px)
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
        {/* Left Side: 3-line Hamburger Button (Mobile only) + Brand Logo */}
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

        {/* Primary Desktop Nav: Core care journeys */}
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
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
            {t.nav.about}
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

          {/* Primary Request Care Button with vibrant gradient */}
          <Link
            className="pub-btn pub-header-cta"
            to="/request-care"
            onClick={() => track('CTA_CLICKED', { cta: 'request_care' })}
          >
            <span>{t.requestCare}</span>
          </Link>
        </div>
      </div>

      {/* Redesigned Mobile Dropdown: Zero separate scrolling, flows with header */}
      {menuOpen && (
        <div className="pub-header-mobile-dropdown" role="dialog" aria-modal="true">
          <div className="pub-container pub-mobile-dropdown-inner">
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

              <NavLink
                to="/how-it-works"
                className={({ isActive }) => `pub-mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="material-symbols-outlined">route</span>
                <span>{t.nav.how}</span>
              </NavLink>

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

            <div className="pub-mobile-footer-actions">
              <Link
                to="/request-care"
                className="pub-btn pub-header-cta"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setMenuOpen(false)}
              >
                <span>{t.requestCare}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>

              <div className="pub-mobile-sub-actions">
                {user ? (
                  <Link
                    to="/app"
                    className="pub-mobile-sub-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined">account_circle</span>
                    <span>Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="pub-mobile-sub-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="material-symbols-outlined">login</span>
                    <span>{t.login}</span>
                  </Link>
                )}

                <div className="pub-mobile-lang-wrap">
                  <LanguageSelector locale={locale} onChange={setLocale} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
