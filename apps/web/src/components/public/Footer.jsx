import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

// Public footer. Link columns are structural; contact block renders CMS
// contact settings; legal links route to CMS-driven legal pages (Phase 16).
export function Footer({ t, contact }) {
  const year = new Date().getFullYear();
  return (
    <footer className="pub-footer">
      <div className="pub-container">
        <div className="pub-footer-grid">
          <div>
            <Link to="/" className="pub-brand" style={{ marginBottom: '1rem' }}>
              <span>{t.brand}</span>
            </Link>
            <p style={{ color: 'var(--pub-on-variant)', maxWidth: '24rem' }}>{t.footerTagline}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.5rem', fontSize: 13, color: 'var(--pub-on-variant)' }}>
              <Icon name="verified_user" size={20} />
              <span>{t.footerTrust ?? 'Verified companions & logistics'}</span>
            </div>
          </div>
          <nav aria-label="Quick links">
            <h4>{t.footerQuick ?? 'Quick Links'}</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/how-it-works">{t.nav.how}</Link></li>
              <li><Link to="/services">{t.nav.services}</Link></li>
              <li><Link to="/hospitals">{t.nav.hospitals}</Link></li>
              <li><Link to="/about">{t.nav.about}</Link></li>
              <li><Link to="/contact">{t.nav.contact}</Link></li>
            </ul>
          </nav>
          <nav aria-label="Services">
            <h4>{t.footerCare ?? 'Care Support'}</h4>
            <ul>
              <li><Link to="/services">Appointment Help</Link></li>
              <li><Link to="/services">Hospital Accompaniment</Link></li>
              <li><Link to="/services">Pickup &amp; Drop</Link></li>
              <li><Link to="/services">Diagnostics Assistance</Link></li>
            </ul>
          </nav>
          <div>
            <h4>{t.footerContact ?? 'Contact & Help'}</h4>
            {contact?.hours_en && (
              <div className="pub-contact-row">
                <Icon name="schedule" size={18} />
                <span>{contact.hours_en}</span>
              </div>
            )}
            {contact?.email && (
              <div className="pub-contact-row">
                <Icon name="mail" size={18} />
                <a href={`mailto:${contact.email}`} style={{ color: 'inherit' }}>{contact.email}</a>
              </div>
            )}
            {contact?.phone && (
              <div className="pub-contact-row">
                <Icon name="call" size={18} />
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} style={{ color: 'var(--pub-primary)', fontWeight: 600 }}>{contact.phone}</a>
              </div>
            )}
            {!contact?.email && !contact?.phone && (
              <div className="pub-contact-row"><Link to="/contact">{t.contactTitle}</Link></div>
            )}
          </div>
        </div>
        <div className="pub-footer-base">
          <p style={{ margin: 0 }}>© {year} {t.brand}. {t.footerLegal ?? 'Care coordination services. Not an emergency medical service or hospital.'}</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/about">Privacy Policy</Link>
            <Link to="/about">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
