import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SYSTEM_APIS = [
  // 1. Care Requests & Telemetry
  {
    method: 'GET',
    route: '/api/v1/requests/:id/details',
    module: 'Requests & Telemetry',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Dedicated Single Request Telemetry page (/app/requests/:id). Streams live escort milestones, attending doctor, OPD consultation room, assigned care companion badge & phone, hospital liaison desk intercom, and post-consultation care dossier without static fallbacks.',
  },
  {
    method: 'GET',
    route: '/api/v1/requests/:id',
    module: 'Requests & Telemetry',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Generic single care request lookup with status history log and cancellation eligibility check.',
  },
  {
    method: 'GET',
    route: '/api/v1/requests',
    module: 'Requests & Telemetry',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: "My Care Requests" customer dashboard list (/app/requests). Displays active escort cards, completed requests, and appointment dates with pagination.',
  },
  {
    method: 'POST',
    route: '/api/v1/requests',
    module: 'Requests & Telemetry',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Booking modal & Intake Flow (/book-accompaniment). Creates a new hospital escort request selecting recipient profile, destination hospital, service package, and mobility directives.',
  },
  {
    method: 'POST',
    route: '/api/v1/requests/:id/cancel',
    module: 'Requests & Telemetry',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Customer self-service cancellation on Request Detail page. Restricted to requests in RECEIVED, UNDER_REVIEW, or ACTION_REQUIRED status.',
  },
  {
    method: 'GET',
    route: '/api/v1/ops/requests',
    module: 'Requests & Telemetry',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Real-time dispatch queue (/requests). Filterable by workflow status, staff assignment, and search queries across Bhimavaram network hospitals.',
  },
  {
    method: 'GET',
    route: '/api/v1/ops/requests/:id',
    module: 'Requests & Telemetry',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Request workstation (/requests/:id). Fetches patient profile, hospital details, companion assignments, audit trail, and allowed state transitions.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/ops/requests/:id',
    module: 'Requests & Telemetry',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Request workstation live editor (/requests/:id). Updates attending doctor name, OPD room, companion phone & badge ID, hospital liaison desk (manager, location, intercom, phone), scheduled time, and publishes clinical visit dossiers to the family.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/ops/requests/:id/status',
    module: 'Requests & Telemetry',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Strict workflow state transition engine. Moves status through closed machine, notifies customer via SMS/dashboard, and logs staff audit records.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/ops/requests/:id/assign',
    module: 'Operations Staff',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Direct companion dispatch assignment. Links a verified BLS staff member to the request.',
  },

  // 2. Authentication & Account
  {
    method: 'POST',
    route: '/api/v1/auth/otp/start',
    module: 'Auth & Account',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '4 attempts / hr (Strict OTP Limit)',
    usage: 'Web: Login & Signup dialogs. Triggers SMS OTP to the customer\'s mobile number. Returns X-RateLimit-Attempts-Remaining header.',
  },
  {
    method: 'POST',
    route: '/api/v1/auth/otp/verify',
    module: 'Auth & Account',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '4 attempts / hr (Strict OTP Limit)',
    usage: 'Web: Login OTP verification. Validates 6-digit code, provisions or retrieves account, and returns HTTP-only JWT auth cookie / access token.',
  },
  {
    method: 'POST',
    route: '/api/v1/auth/session/refresh',
    module: 'Auth & Account',
    auth: 'Session Token',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web & CMS: Automatic background token refresh on window focus and 401 recovery.',
  },
  {
    method: 'POST',
    route: '/api/v1/auth/logout',
    module: 'Auth & Account',
    auth: 'Authenticated',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web & CMS: User logout button. Revokes active session and clears auth cookies.',
  },
  {
    method: 'GET',
    route: '/api/v1/account/me',
    module: 'Auth & Account',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Header user pill & Profile page. Returns authenticated user\'s full name, phone number, email, and preferred locale.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/account/me',
    module: 'Auth & Account',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Account Settings (/app/profile). Updates user profile information, contact email, and notification preferences.',
  },

  // 3. Care Recipients
  {
    method: 'GET',
    route: '/api/v1/account/recipients',
    module: 'Care Recipients',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Family profiles (/app/recipients) & booking modal dropdown. Lists registered elderly parents/family members.',
  },
  {
    method: 'POST',
    route: '/api/v1/account/recipients',
    module: 'Care Recipients',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Add New Recipient modal. Registers a family member with DOB, medical conditions, allergies, and mobility requirements.',
  },
  {
    method: 'GET',
    route: '/api/v1/account/recipients/:id',
    module: 'Care Recipients',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Single recipient health dossier view. Returns detailed health history, physician notes, and past appointments.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/account/recipients/:id',
    module: 'Care Recipients',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Edit Recipient form. Updates relationship, phone, mobility tier, and emergency directives.',
  },
  {
    method: 'DELETE',
    route: '/api/v1/account/recipients/:id',
    module: 'Care Recipients',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Recipient removal action. Soft-deletes a family member profile.',
  },

  // 4. Hospitals & Services Catalog
  {
    method: 'GET',
    route: '/api/v1/hospitals',
    module: 'Network & Catalog',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web & CMS: Hospital selection dropdown, Network map, and Partner Hospitals listing page (/hospitals).',
  },
  {
    method: 'GET',
    route: '/api/v1/hospitals/:id',
    module: 'Network & Catalog',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web & CMS: Partner Hospital profile (/hospitals/:id). Returns departments, liaison desk coordinates, and facilities.',
  },
  {
    method: 'POST',
    route: '/api/v1/ops/hospitals',
    module: 'Network & Catalog',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Add Hospital form (/hospitals/new). Onboards a new partner medical facility in Bhimavaram.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/ops/hospitals/:id',
    module: 'Network & Catalog',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Edit Hospital form (/hospitals/:id). Configures station desk, OPD contacts, address, and specialty tiers.',
  },
  {
    method: 'GET',
    route: '/api/v1/services',
    module: 'Network & Catalog',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web: Services landing section, Booking modal package picker, and Services Catalog page (/services).',
  },
  {
    method: 'POST',
    route: '/api/v1/ops/services',
    module: 'Network & Catalog',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Create Service Package form (/services/new). Adds a new accompaniment tier or health package.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/ops/services/:id',
    module: 'Network & Catalog',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Edit Service Package form (/services/:id). Edits package pricing, inclusions, and bilingual copy.',
  },

  // 5. CMS & Website Content
  {
    method: 'GET',
    route: '/api/v1/cms/blocks',
    module: 'CMS & Content',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web & CMS: Content Blocks engine. Supplies live micro-copy for emergency helplines, station manager defaults, and telemetry banners.',
  },
  {
    method: 'PATCH',
    route: '/api/v1/ops/cms/blocks/:key',
    module: 'CMS & Content',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Content Blocks editor (/cms/blocks). Updates website copy without requiring code deployments.',
  },
  {
    method: 'GET',
    route: '/api/v1/cms/hero-slides',
    module: 'CMS & Content',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web: Homepage interactive carousel (/cms/hero-slides). Delivers bilingual headlines, CTAs, and background photography.',
  },
  {
    method: 'GET',
    route: '/api/v1/cms/faqs',
    module: 'CMS & Content',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web: Landing page FAQ section and Help Center (/cms/faqs). Categorized Telugu/English answers.',
  },
  {
    method: 'GET',
    route: '/api/v1/cms/testimonials',
    module: 'CMS & Content',
    auth: 'Public',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web: Patient and family reviews slider on public homepage.',
  },
  {
    method: 'POST',
    route: '/api/v1/ops/media/upload',
    module: 'CMS & Content',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Media Library asset uploader (/media). Handles image and PDF document uploads with checksum verification.',
  },

  // 6. Support & Notifications
  {
    method: 'GET',
    route: '/api/v1/support/notifications',
    module: 'Support & Alerts',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Header Notification bell & Dropdown (/app/notifications). Returns real-time alerts for escort arrivals, delays, and doctor reviews.',
  },
  {
    method: 'POST',
    route: '/api/v1/support/tickets',
    module: 'Support & Alerts',
    auth: 'Customer JWT',
    authBadge: 'active',
    rateLimit: '8 req / min',
    usage: 'Web: Contact Support modal & Help Desk. Submits customer assistance tickets.',
  },
  {
    method: 'GET',
    route: '/api/v1/ops/support',
    module: 'Support & Alerts',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Support ticket inbox (/support). Triage desk for customer inquiries and escort complaints.',
  },

  // 7. System, Analytics & Audit
  {
    method: 'POST',
    route: '/api/v1/analytics/events',
    module: 'Audit & Analytics',
    auth: 'Public / Authed',
    authBadge: 'public',
    rateLimit: '8 req / min',
    usage: 'Web: Telemetry tracker. Records client navigation, booking funnel completions, and telemetry pulse pings.',
  },
  {
    method: 'GET',
    route: '/api/v1/ops/analytics/metrics',
    module: 'Audit & Analytics',
    auth: 'Operations Staff',
    authBadge: 'confirmed',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Real-time dashboard KPI cards (/analytics). Computes total escorts, SLA adherence, and active field companions.',
  },
  {
    method: 'GET',
    route: '/api/v1/ops/audit',
    module: 'Audit & Analytics',
    auth: 'Operations Head',
    authBadge: 'cancelled',
    rateLimit: '8 req / min',
    usage: 'CMS Operations: Immutable security audit log (/audit-logs). Tracks every state transition, user modification, and CMS change.',
  },
];

export function ApiDirectory() {
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');

  const modules = ['ALL', ...new Set(SYSTEM_APIS.map((a) => a.module))];
  const methods = ['ALL', 'GET', 'POST', 'PATCH', 'DELETE'];

  const filtered = SYSTEM_APIS.filter((api) => {
    if (selectedModule !== 'ALL' && api.module !== selectedModule) return false;
    if (selectedMethod !== 'ALL' && api.method !== selectedMethod) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoute = api.route.toLowerCase().includes(q);
      const matchUsage = api.usage.toLowerCase().includes(q);
      const matchModule = api.module.toLowerCase().includes(q);
      const matchAuth = api.auth.toLowerCase().includes(q);
      if (!matchRoute && !matchUsage && !matchModule && !matchAuth) return false;
    }
    return true;
  });

  const getMethodBadge = (m) => {
    switch (m) {
      case 'GET':
        return <span className="ops-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>GET</span>;
      case 'POST':
        return <span className="ops-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 800 }}>POST</span>;
      case 'PATCH':
        return <span className="ops-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 800 }}>PATCH</span>;
      case 'DELETE':
        return <span className="ops-badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 800 }}>DELETE</span>;
      default:
        return <span className="ops-badge ops-badge-pending">{m}</span>;
    }
  };

  const getAuthBadge = (auth, badge) => {
    switch (badge) {
      case 'confirmed':
        return <span className="ops-badge ops-badge-confirmed">{auth}</span>;
      case 'active':
        return <span className="ops-badge ops-badge-active">{auth}</span>;
      case 'cancelled':
        return <span className="ops-badge ops-badge-cancelled">{auth}</span>;
      default:
        return <span className="ops-badge ops-badge-pending">{auth}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--ops-primary)' }}>
              api
            </span>
            <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
              System APIs &amp; Usage Directory
            </h1>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Complete live catalog of all backend REST endpoints in AayuYukthi, their role permissions, rate-limit policies, and application usage.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/requests" className="ops-btn ops-btn-secondary ops-btn-sm" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment</span>
            Care Requests Queue
          </Link>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--ops-surface-container-low)',
          borderRadius: 'var(--ops-radius-md)',
          border: '1px solid var(--ops-outline-subtle)',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-outline)', textTransform: 'uppercase' }}>
            Total Registered APIs
          </span>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            {SYSTEM_APIS.length}
          </p>
        </div>

        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--ops-surface-container-low)',
          borderRadius: 'var(--ops-radius-md)',
          border: '1px solid var(--ops-outline-subtle)',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-outline)', textTransform: 'uppercase' }}>
            Requests &amp; Telemetry
          </span>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            {SYSTEM_APIS.filter((a) => a.module === 'Requests & Telemetry').length}
          </p>
        </div>

        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--ops-surface-container-low)',
          borderRadius: 'var(--ops-radius-md)',
          border: '1px solid var(--ops-outline-subtle)',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-outline)', textTransform: 'uppercase' }}>
            Operations &amp; Dispatch
          </span>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            {SYSTEM_APIS.filter((a) => a.auth.includes('Operations')).length}
          </p>
        </div>

        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--ops-surface-container-low)',
          borderRadius: 'var(--ops-radius-md)',
          border: '1px solid var(--ops-outline-subtle)',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-outline)', textTransform: 'uppercase' }}>
            Rate Limiting Policy
          </span>
          <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--ops-secondary)' }}>
            8 req/min (4 OTP/hr)
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="ops-card" style={{ gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Method Filter */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ops-outline)', marginRight: '0.25rem' }}>Method:</span>
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                className={`ops-btn ops-btn-sm ${selectedMethod === m ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
                onClick={() => setSelectedMethod(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ops-outline)',
                fontSize: '18px',
              }}
            >
              search
            </span>
            <input
              className="ops-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by route, usage, or module…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Module Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {modules.map((mod) => (
            <button
              key={mod}
              type="button"
              className={`ops-btn ops-btn-sm ${selectedModule === mod ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
              onClick={() => setSelectedModule(mod)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabular View */}
      <div className="ops-card">
        <div className="ops-card-header">
          <h2 className="ops-card-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              table_chart
            </span>
            Application APIs &amp; Usage Matrix ({filtered.length} endpoints)
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Method</th>
                <th style={{ width: '240px' }}>API Route / Endpoint</th>
                <th style={{ width: '160px' }}>Module</th>
                <th style={{ width: '160px' }}>Access / Roles</th>
                <th style={{ minWidth: '320px' }}>Application Usage &amp; Features</th>
                <th style={{ width: '140px' }}>Rate Limit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={idx}>
                  <td>{getMethodBadge(item.method)}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem' }}>
                    {item.route}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ops-secondary)' }}>
                      {item.module}
                    </span>
                  </td>
                  <td>{getAuthBadge(item.auth, item.authBadge)}</td>
                  <td style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                    {item.usage}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--ops-outline)' }}>
                      {item.rateLimit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
