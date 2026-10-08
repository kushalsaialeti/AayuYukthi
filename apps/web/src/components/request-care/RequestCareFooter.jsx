import React from 'react';
import { Link } from 'react-router-dom';

export function RequestCareFooter({ helplinePhone = '1800-AAYU-CARE' }) {
  const cleanHelpline = typeof helplinePhone === 'object'
    ? (helplinePhone.body_en || helplinePhone.title_en || '1800-AAYU-CARE')
    : String(helplinePhone || '1800-AAYU-CARE');

  return (
    <footer className="rc-footer">
      <div className="rc-footer-inner">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--cust-primary)', fontWeight: 600, fontSize: '0.8125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              verified_user
            </span>
            <span>256-Bit Encrypted Portal</span>
          </div>
          <span style={{ color: 'var(--cust-outline-variant)' }}>•</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--cust-outline)' }}>
            Non-clinical compassionate assistance. For medical emergencies, dial 112 immediately.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
          <span>© {new Date().getFullYear()} AayuYukthi Care Network</span>
          <a
            href={`tel:${cleanHelpline.replace(/[^0-9]/g, '') || '1800229822'}`}
            style={{ color: 'var(--cust-on-surface-variant)', textDecoration: 'none' }}
          >
            Toll-Free Assistance
          </a>
          <Link
            to="/contact"
            style={{ color: 'var(--cust-on-surface-variant)', textDecoration: 'none' }}
          >
            Support &amp; Compliance
          </Link>
        </div>
      </div>
    </footer>
  );
}
