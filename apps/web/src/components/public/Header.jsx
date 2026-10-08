import { Link, NavLink } from 'react-router-dom';
import { LanguageSelector } from '../../i18n.jsx';
import { track } from '../../analytics.js';

// Fixed public header. Logo + nav + CTAs. All labels are UI strings (locale),
// the brand mark comes from CMS media when provided (logoUrl prop).
export function Header({ t, locale, setLocale, user, logoUrl }) {
  return (
    <header className="pub-header">
      <div className="pub-container pub-header-inner">
        <Link to="/" className="pub-brand" aria-label={t.brand}>
          {logoUrl ? (
            <img src={logoUrl} alt={`${t.brand} logo`} />
          ) : (
            <span
              style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--pub-primary)',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
              }}
              aria-hidden="true"
            >
              A
            </span>
          )}
          <span>{t.brand}</span>
        </Link>
        <nav className="pub-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>{t.navHome ?? 'Home'}</NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => (isActive ? 'active' : '')}>{t.nav.how}</NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : '')}>{t.nav.services}</NavLink>
          <NavLink to="/hospitals" className={({ isActive }) => (isActive ? 'active' : '')}>{t.nav.hospitals}</NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>{t.nav.about}</NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>{t.nav.contact}</NavLink>
        </nav>
        <div className="pub-header-actions">
          <LanguageSelector locale={locale} onChange={setLocale} />
          {user ? (
            <Link
              to="/app"
              aria-label={t.myAccount || 'Dashboard'}
              title="Return to Care Portal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0, 104, 116, 0.08)',
                color: 'var(--pub-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: '1px solid rgba(0, 104, 116, 0.2)'
              }}
            >
              <span
                style={{
                  width: 26, height: 26, borderRadius: 9999, background: 'var(--pub-primary)',
                  color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                }}
              >
                {(user.full_name ?? user.email ?? 'A').slice(0, 1).toUpperCase()}
              </span>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link className="pub-login" to="/login" onClick={() => track('CTA_CLICKED', { cta: 'login' })}>
              {t.login}
            </Link>
          )}
          <Link className="pub-btn" to="/request-care" onClick={() => track('CTA_CLICKED', { cta: 'request_care' })}>
            {t.requestCare}
          </Link>
        </div>
      </div>
    </header>
  );
}
