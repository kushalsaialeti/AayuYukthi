import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useCustomerAuth } from '../auth.jsx';
import { useDocumentMeta } from '../components/layout.jsx';
import { api, tokenStore } from '../api.js';
import { CustomerSidebar } from '../components/customer/CustomerSidebar.jsx';
import { CustomerHeader } from '../components/customer/CustomerHeader.jsx';
import '../components/customer/customer.css';
import { DashboardWelcomeBar } from '../components/dashboard/DashboardWelcomeBar.jsx';
import { DashboardActiveVisitHero } from '../components/dashboard/DashboardActiveVisitHero.jsx';
import { DashboardMetricsOverview } from '../components/dashboard/DashboardMetricsOverview.jsx';
import { DashboardRequestsFeed } from '../components/dashboard/DashboardRequestsFeed.jsx';
import { DashboardRecipientsWidget } from '../components/dashboard/DashboardRecipientsWidget.jsx';
import '../components/dashboard/dashboard.css';

export const CustomerLayoutContext = React.createContext(false);

export function CustomerLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    // Fetch notifications for unread count badge
    api.authedNotifications({ limit: 20 })
      .then((res) => {
        if (!active) return;
        const unread = (res?.data || []).filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <CustomerLayoutContext.Provider value={true}>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--cust-surface)' }}>
        <CustomerSidebar
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          isCollapsed={isCollapsed}
          onCollapse={() => {
            setIsCollapsed(true);
            setIsMobileOpen(false);
          }}
          onExpand={() => {
            setIsCollapsed(false);
          }}
          unreadCount={unreadCount}
        />
        <CustomerHeader
          isCollapsed={isCollapsed}
          unreadCount={unreadCount}
          onMenuToggle={handleToggleSidebar}
        />
        <main className={`customer-main-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
          <Outlet />
        </main>
      </div>
    </CustomerLayoutContext.Provider>
  );
}

function extractBlockText(block, preferred = 'body_en', fallback = '') {
  if (!block) return fallback;
  if (typeof block === 'string') return block;
  if (typeof block === 'object') {
    return block[preferred] || block.body_en || block.title_en || block.body || block.title || fallback;
  }
  return String(block);
}

export function CustomerDashboard() {
  const { user, setUser } = useCustomerAuth();
  useDocumentMeta('Dashboard', 'Your AayuYukthi care coordination portal.');
  const needsSetup = !user?.onboarding_completed_at;

  const [requests, setRequests] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [helplinePhone, setHelplinePhone] = useState('1800-AAYU-CARE');
  const [totalRequestsCount, setTotalRequestsCount] = useState(0);
  const [totalRecipientsCount, setTotalRecipientsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.me().catch(() => null),
      api.authedList({ limit: 10 }).catch(() => ({ data: [], pagination: { total: 0 } })),
      api.recipients({ limit: 10 }).catch(() => ({ data: [], total: 0 })),
      api.contactInfo().catch(() => null),
    ]).then(([meRes, reqsRes, recsRes, contactRes]) => {
      if (!active) return;

      if (meRes) {
        setUser(meRes);
        try {
          sessionStorage.setItem('ay-user', JSON.stringify(meRes));
          if (tokenStore.isRemembered && tokenStore.isRemembered()) {
            localStorage.setItem('ay-user', JSON.stringify(meRes));
          }
        } catch {}
      }

      const reqItems = reqsRes?.data || [];
      const recItems = recsRes?.data || [];

      setRequests(reqItems);
      setTotalRequestsCount(reqsRes?.pagination?.total ?? (reqsRes?.total ?? reqItems.length));
      setRecipients(recItems);
      setTotalRecipientsCount(recsRes?.pagination?.total ?? (recsRes?.total ?? recItems.length));

      if (contactRes?.phone) {
        setHelplinePhone(contactRes.phone);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const activeRequests = requests.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
  const completedRequests = requests.filter((r) => r.status === 'COMPLETED');
  const activeVisit = activeRequests[0] || null;

  const recipientsPreview = recipients
    .slice(0, 3)
    .map((r) => r.full_name || r.name)
    .filter(Boolean)
    .join(', ');

  const nextHospitalName = activeVisit?.hospital?.name || '';

  return (
    <div className="dash-wrapper">
      {/* Onboarding setup reminder banner if user profile not complete */}
      {needsSetup && (
        <div className="dash-setup-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>info</span>
            <span>Complete your profile setup to get started quickly.</span>
          </div>
          <Link
            to="/onboarding"
            className="cust-btn-secondary"
            style={{ backgroundColor: '#ffffff', color: 'var(--cust-primary)', whiteSpace: 'nowrap' }}
          >
            Complete Setup
          </Link>
        </div>
      )}

      {/* 1. Header Welcome Bar */}
      <DashboardWelcomeBar
        user={user}
        activeCount={activeRequests.length}
        nextHospitalName={nextHospitalName}
      />

      {/* 2. Real-Time Active Hospital Visit Hero Card */}
      <DashboardActiveVisitHero
        activeVisit={activeVisit}
        helplinePhone={helplinePhone}
      />

      {/* 3. Key Metrics (3-card Grid) */}
      <DashboardMetricsOverview
        activeCount={activeRequests.length}
        recipientsCount={totalRecipientsCount}
        completedCount={completedRequests.length}
        recipientsPreview={recipientsPreview}
        nextHospitalName={nextHospitalName}
      />

      {/* 4. Two-Column: Requests Feed + Recipients Widget */}
      <div className="dash-two-col-layout">
        <DashboardRequestsFeed
          requests={requests}
          totalCount={totalRequestsCount}
        />

        <div className="dash-side-widgets">
          <DashboardRecipientsWidget recipients={recipients} />
        </div>
      </div>
    </div>
  );
}
