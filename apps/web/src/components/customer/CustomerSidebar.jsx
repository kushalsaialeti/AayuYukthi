import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../auth.jsx';

export function CustomerSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onCollapse,
  onExpand,
  unreadCount = 0,
}) {
  const { user, logout } = useCustomerAuth();
  const location = useLocation();

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: 'space_dashboard' },
    { path: '/request-care', label: 'Request Care', icon: 'calendar_add_on' },
    { path: '/app/requests', label: 'My Requests', icon: 'assignment' },
    { path: '/app/recipients', label: 'Care Recipients', icon: 'group' },
    { path: '/app/notifications', label: 'Notifications', icon: 'notifications', badge: unreadCount > 0 ? unreadCount : null },
    { path: '/app/support', label: 'Support', icon: 'headset_mic' },
    { path: '/app/profile', label: 'Profile', icon: 'manage_accounts' },
  ];

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`customer-sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`customer-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${isOpen ? 'is-open' : ''}`}>
        {/* 1. Top Brand Header - Pinned at top, never scrolls away */}
        <div style={{
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--cust-surface-container-lowest)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0.875rem 0.5rem' : '1rem 1rem 0.75rem 1rem',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
        }}>
          {isCollapsed ? (
            /* When collapsed: clicking logo expands the sidebar */
            <button
              type="button"
              onClick={onExpand}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Click logo to expand sidebar"
              aria-label="Expand sidebar"
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.625rem',
                  backgroundColor: 'var(--cust-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(13, 92, 99, 0.25)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>spa</span>
              </div>
            </button>
          ) : (
            /* When expanded: show logo brand + wrong mark (✕) button to collapse */
            <>
              <Link
                to="/app"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none'
                }}
                title="AayuYukthi"
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.625rem',
                  backgroundColor: 'var(--cust-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>spa</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--cust-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    AayuYukthi
                  </span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--cust-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Care Coordination
                  </span>
                </div>
              </Link>

              {/* Wrong mark (✕) to collapse sidebar */}
              <button
                type="button"
                onClick={onCollapse}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cust-on-surface-variant)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--cust-surface-container-high)';
                  e.currentTarget.style.color = 'var(--cust-on-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--cust-on-surface-variant)';
                }}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
              </button>
            </>
          )}
        </div>

        {/* 2. Middle Scrollable Nav Area */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: isCollapsed ? '0.75rem 0.5rem' : '0.875rem 1rem'
        }}>
          {/* Quick Action: Request Care Button */}
          <div style={{ marginBottom: '1.25rem' }}>
            <Link
              to="/request-care"
              className="cust-btn-primary"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: isCollapsed ? '0.625rem 0' : '0.625rem 1rem',
                justifyContent: 'center'
              }}
              onClick={onClose}
              title="Request Care"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
              {!isCollapsed && <span>Request Care</span>}
            </Link>
          </div>

          {/* Navigation Links (Icons only when collapsed) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const isActive = item.path === '/app'
                ? location.pathname === '/app'
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`cust-nav-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                  title={item.label}
                  style={{
                    justifyContent: isCollapsed ? 'center' : 'flex-start'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    {item.icon}
                  </span>

                  {!isCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}

                  {item.badge && (
                    <span style={{
                      backgroundColor: 'var(--cust-error-container)',
                      color: 'var(--cust-on-error-container)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: isCollapsed ? '0.125rem' : '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      position: isCollapsed ? 'absolute' : 'static',
                      top: isCollapsed ? '6px' : 'auto',
                      right: isCollapsed ? '10px' : 'auto',
                      minWidth: isCollapsed ? '8px' : 'auto',
                      height: isCollapsed ? '8px' : 'auto'
                    }}>
                      {!isCollapsed && item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Home Button & User Profile */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: isCollapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
          gap: '0.35rem',
          borderTop: '1px solid rgba(0, 0, 0, 0.04)'
        }}>

          {/* Home Button placed directly above logout - takes to landing page while staying logged in */}
          <Link
            to="/"
            className={`cust-nav-link ${location.pathname === '/' ? 'active' : ''}`}
            title="Landing Page"
            onClick={onClose}
            style={{
              justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>home</span>
            {!isCollapsed && <span>Home</span>}
          </Link>

          {/* User Profile / Logout Button */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="cust-nav-link"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                justifyContent: 'center',
                padding: '0.625rem 0'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--cust-on-surface-variant)' }}>
                logout
              </span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.625rem',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--cust-surface-container-high)'
            }}>
              <Link
                to="/app/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  flex: 1,
                  borderRadius: '0.5rem',
                  padding: '0.2rem',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cust-surface-container)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                title="View Caregiver Profile & Settings"
              >
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--cust-primary-container)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  flexShrink: 0
                }}>
                  {getInitials(user?.full_name)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--cust-on-surface)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user?.full_name || user?.email?.split('@')[0] || 'Caregiver'}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--cust-secondary)' }}>
                    Primary Caregiver
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cust-on-surface-variant)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.375rem',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cust-error)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cust-on-surface-variant)')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
