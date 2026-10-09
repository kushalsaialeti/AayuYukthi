import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: 'space_dashboard' },
    ],
  },
  {
    title: 'Operations & Dispatch',
    items: [
      { label: 'Care Requests', path: '/requests', icon: 'assignment' },
      { label: 'Customers', path: '/customers', icon: 'group' },
      { label: 'Support Desk', path: '/support', icon: 'headset_mic' },
    ],
  },
  {
    title: 'Healthcare Network',
    items: [
      { label: 'Services Catalog', path: '/services', icon: 'medical_services' },
      { label: 'Partner Hospitals', path: '/hospitals', icon: 'local_hospital', badge: 'Bhimavaram' },
    ],
  },
  {
    title: 'CMS & Website Copy',
    items: [
      { label: 'Content Blocks', path: '/cms/blocks', icon: 'dashboard_customize' },
      { label: 'Recipient Form CMS', path: '/cms/recipient-form', icon: 'badge' },
      { label: 'Hero Slides', path: '/cms/hero-slides', icon: 'view_carousel' },
      { label: 'Testimonials', path: '/cms/testimonials', icon: 'rate_review' },
      { label: 'FAQs', path: '/cms/faqs', icon: 'quiz' },
      { label: 'Contact Details', path: '/cms/contact', icon: 'contact_phone' },
      { label: 'Media Library', path: '/media', icon: 'photo_library' },
    ],
  },
  {
    title: 'System & Security',
    items: [
      { label: 'API Directory', path: '/system/apis', icon: 'api', badge: 'Catalog' },
      { label: 'Analytics', path: '/analytics', icon: 'monitoring' },
      { label: 'Audit Trail', path: '/audit-logs', icon: 'history' },
    ],
  },
];

export function OpsSidebar({ isOpen, onClose }) {
  const { roles, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`ops-sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`ops-sidebar ${isOpen ? 'is-open' : ''}`}>
        {/* Brand Header */}
        <div className="ops-sidebar-header">
          <NavLink to="/" className="ops-sidebar-brand" onClick={onClose}>
            <div className="ops-brand-logo-box">
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                spa
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--ops-primary)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                AayuYukthi
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--ops-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Operations &amp; CMS
              </span>
            </div>
          </NavLink>

          <button
            type="button"
            className="ops-sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation sidebar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              close
            </span>
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="ops-sidebar-nav">
          {NAV_GROUPS.map((grp) => (
            <div key={grp.title} className="ops-nav-group">
              <div className="ops-nav-group-title">{grp.title}</div>
              <div className="ops-nav-group-links">
                {grp.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `ops-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.badge && <span className="ops-nav-badge">{item.badge}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Info & Actions */}
        <div className="ops-sidebar-footer">
          {/* User Role Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-on-surface)' }}>
                Operations Staff
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)' }}>
                {(roles ?? ['operations']).join(' • ')}
              </span>
            </div>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '9999px',
              backgroundColor: 'var(--ops-success)',
              boxShadow: '0 0 6px rgba(21, 128, 61, 0.4)'
            }} />
          </div>

          {/* View Public Portal */}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="ops-btn ops-btn-secondary ops-btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--ops-primary)' }}>
              open_in_new
            </span>
            <span>View Public Website</span>
          </a>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="ops-btn ops-btn-sm"
            style={{
              width: '100%',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: 'var(--ops-outline)',
              border: 'none',
              padding: '0.35rem'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ops-error)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ops-outline)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              logout
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
