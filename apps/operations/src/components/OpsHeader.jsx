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

export function OpsHeader({ onToggleSidebar }) {
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
        <button
          type="button"
          className="ops-mobile-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Open operations menu"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
            menu
          </span>
        </button>
        <h1 className="ops-header-title">
          {currentTitle}
        </h1>
      </div>

      <div className="ops-header-actions-area">
        {/* Live hub indicator */}
        <div className="ops-header-live-badge">
          <span className="ops-live-dot" />
          <span className="ops-live-text">Bhimavaram Live Desk</span>
        </div>

        {/* Quick action: Website CMS or New */}
        <Link
          to="/cms/blocks"
          className="ops-btn ops-btn-secondary ops-btn-sm ops-header-quick-action"
          title="Quick edit website copy and announcements"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--ops-primary)' }}>
            edit_note
          </span>
          <span className="ops-quick-action-text">Edit Website Copy</span>
        </Link>
      </div>
    </header>
  );
}
