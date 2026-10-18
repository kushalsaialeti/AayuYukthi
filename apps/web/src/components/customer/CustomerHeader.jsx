import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../auth.jsx';

export function CustomerHeader({
  isCollapsed,
  unreadCount = 0,
  onMenuToggle,
}) {
  const { user } = useCustomerAuth();
  const location = useLocation();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/request-care' || path === '/app/request-care') return 'Request Care';
    if (path.startsWith('/app/recipients')) return 'Care Recipients';
    if (path.startsWith('/app/requests/') && path !== '/app/requests') return 'Request Details';
    if (path.startsWith('/app/requests')) return 'My Requests';
    if (path.startsWith('/app/notifications')) return 'Notifications';
    if (path.startsWith('/app/support')) return 'Support';
    if (path.startsWith('/app/profile')) return 'Profile';
    if (path === '/app') return 'Dashboard';
    return 'AayuYukthi';
  };

  const pageTitle = getPageTitle();

  return (
    <header className={`customer-header ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Left side: Mobile menu + Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Mobile hamburger menu */}
        <button
          type="button"
          className="customer-header-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>menu</span>
        </button>

        <h1 style={{
          margin: 0,
          fontSize: '1.0625rem',
          fontWeight: 600,
          color: 'var(--cust-on-surface)',
        }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right side: Notifications + Profile avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {/* Notifications Icon */}
        <Link
          to="/app/notifications"
          className="customer-header-icon-btn"
          title="Notifications"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
          {unreadCount > 0 && (
            <span className="customer-header-notif-dot" />
          )}
        </Link>

        {/* Profile Avatar - compact */}
        <Link
          to="/app/profile"
          className="customer-header-avatar"
          title="Profile"
        >
          <span>{getInitials(user?.full_name)}</span>
        </Link>
      </div>
    </header>
  );
}
