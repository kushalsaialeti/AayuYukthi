import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../auth.jsx';

export function CustomerHeader({
  isCollapsed,
  unreadCount = 0,
}) {
  const { user } = useCustomerAuth();
  const location = useLocation();
  const isRequestCare = location.pathname === '/request-care' || location.pathname === '/app/request-care';
  const isRecipientsPage = location.pathname.startsWith('/app/recipients') || location.pathname.startsWith('/recipients');

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/request-care' || path === '/app/request-care') return 'Request Care Accompaniment';
    if (path.startsWith('/app/recipients')) return 'Care Recipients';
    if (path.startsWith('/app/requests/') && path !== '/app/requests') return 'Care Request Details';
    if (path.startsWith('/app/requests')) return 'My Care Requests';
    if (path.startsWith('/app/notifications')) return 'Notifications';
    if (path.startsWith('/app/support')) return 'Support & Help Desk';
    if (path.startsWith('/app/profile')) return 'Caregiver Profile';
    if (path === '/app') return 'Family Dashboard';
    return 'Care Coordination';
  };

  const pageTitle = getPageTitle();

  return (
    <header
      className={`customer-header ${isCollapsed ? 'is-collapsed' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
      }}
    >
      {/* Left side: Standard Portal Badge + Page Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--cust-secondary-fixed, #cee5ff)',
          color: 'var(--cust-on-secondary-fixed, #041d31)',
          letterSpacing: '0.02em',
        }}>
          Family Care Portal
        </span>

        <span style={{ color: 'var(--cust-outline-variant)' }}>•</span>

        <span
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--cust-on-surface)',
          }}
        >
          {pageTitle}
        </span>
      </div>

      {/* Right Area: Exit to Dashboard (on Request Care) + Notifications + Profile Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {isRequestCare && (
          <Link
            to="/app"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.625rem',
              backgroundColor: 'var(--cust-surface-container-low)',
              color: 'var(--cust-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid var(--cust-outline-variant, #bfc8c9)',
              transition: 'all 0.15s ease',
            }}
            title="Return to Customer Dashboard"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            <span>Exit to Dashboard</span>
          </Link>
        )}

        {/* On Care Recipients page: Add Care Recipient action button beside notifications */}
        {isRecipientsPage && (
          <Link
            to="/app/recipients?new=1"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('ay:add-recipient'));
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '0.625rem',
              backgroundColor: 'var(--cust-primary)',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0, 67, 73, 0.25)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            title="Add Care Recipient"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span>Add Care Recipient</span>
          </Link>
        )}

        {/* Notifications Icon Button */}
        <Link
          to="/app/notifications"
          style={{
            position: 'relative',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.625rem',
            backgroundColor: 'var(--cust-surface-container-low)',
            color: 'var(--cust-on-surface-variant)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
          title="Notifications"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--cust-error)',
              borderRadius: '9999px',
            }} />
          )}
        </Link>

        {/* Profile Banner: Coordinated with Sidebar Profile Link */}
        <Link
          to="/app/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.35rem 0.625rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--cust-surface-container-low)',
            textDecoration: 'none',
            cursor: 'pointer',
            border: '1px solid transparent',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--cust-surface-container)';
            e.currentTarget.style.borderColor = 'var(--cust-outline-variant, #bfc8c9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--cust-surface-container-low)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          title="Caregiver Profile & Family Account"
        >
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--cust-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8125rem',
            flexShrink: 0,
          }}>
            {getInitials(user?.full_name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)', whiteSpace: 'nowrap' }}>
              {user?.full_name || user?.email?.split('@')[0] || 'Caregiver'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--cust-secondary)', whiteSpace: 'nowrap' }}>
              Family Account
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
