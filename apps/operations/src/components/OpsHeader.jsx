import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const SECTION_TITLES = {
  '/': 'Operations Overview',
  '/requests': 'Care Requests Queue',
  '/customers': 'Customer Profiles & Families',
  '/support': 'Customer Support Inquiries',
  '/services': 'Services Catalog',
  '/hospitals': 'Bhimavaram Partner Hospitals',
  '/cms/blocks': 'Website Content Blocks',
  '/cms/recipient-form': 'Recipient Form Directives CMS',
  '/cms/hero-slides': 'Homepage Hero Slides',
  '/cms/testimonials': 'Customer Testimonials',
  '/cms/faqs': 'Frequently Asked Questions',
  '/cms/contact': 'Contact Desk Settings',
  '/media': 'Media Assets & CDN',
  '/analytics': 'Platform Analytics',
  '/audit-logs': 'Security Audit Trail',
};

export function OpsHeader() {
  const location = useLocation();
  const currentTitle = SECTION_TITLES[location.pathname] ||
    (location.pathname.startsWith('/services/') ? 'Service Configuration' :
     location.pathname.startsWith('/hospitals/') ? 'Hospital Campus Details' :
     location.pathname.startsWith('/requests/') ? 'Care Request Detail' :
     location.pathname.startsWith('/customers/') ? 'Customer Account Detail' :
     location.pathname.startsWith('/support/') ? 'Support Ticket Detail' :
     'Operations Portal');

  return (
    <header className="ops-top-header">
      <div className="ops-header-title-area">
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ops-on-surface)' }}>
          {currentTitle}
        </h1>
      </div>

      <div className="ops-header-actions-area">
        {/* Live hub indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--ops-radius-pill)',
          backgroundColor: 'var(--ops-surface-container-low)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--ops-on-surface-variant)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '9999px',
            backgroundColor: 'var(--ops-success)',
            boxShadow: '0 0 6px rgba(21, 128, 61, 0.4)'
          }} />
          <span>Bhimavaram Live Operations</span>
        </div>

        {/* Quick action: Website CMS or New */}
        <Link
          to="/cms/blocks"
          className="ops-btn ops-btn-secondary ops-btn-sm"
          title="Quick edit website copy and announcements"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--ops-primary)' }}>
            edit_note
          </span>
          <span>Edit Website Copy</span>
        </Link>
      </div>
    </header>
  );
}
