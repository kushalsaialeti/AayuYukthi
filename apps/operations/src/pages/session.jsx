import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { Field, ErrorAlert, StatusBadge } from '../components/ui.jsx';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--ops-surface)',
      padding: '1.5rem',
      fontFamily: 'var(--ops-font)'
    }}>
      <div className="ops-card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="ops-brand-logo-box" style={{ width: '3rem', height: '3rem', marginBottom: '0.75rem', borderRadius: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>spa</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            AayuYukthi
          </h1>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>
            Operations &amp; CMS Console
          </span>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            Authorized administrator &amp; coordinator access
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <ErrorAlert error={error} />

          <Field label="Staff Email" required>
            <input
              className="ops-input"
              type="email"
              autoComplete="username"
              placeholder="admin@aayuyukthi.example"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Password" required>
            <input
              className="ops-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <button
            type="submit"
            className="ops-btn ops-btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem', fontSize: '0.875rem' }}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>progress_activity</span>
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                <span>Sign into Operations</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--ops-outline-subtle)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
          <span>Protected system. All sessions are logged for audit compliance.</span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [metrics, setMetrics] = useState({
    requests: 0,
    activeRequests: 0,
    customers: 0,
    hospitals: 0,
    services: 0,
    support: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const fetchLiveDashboard = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [reqs, custs, hosps, svcs, supp] = await Promise.all([
        api.list('requests', { limit: 10 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        api.list('customers', { limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
        api.list('hospitals', { limit: 100 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        api.list('services', { limit: 100 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        api.list('support', { limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
      ]);

      const reqList = reqs?.data || [];
      const hospList = hosps?.data || [];
      const svcList = svcs?.data || [];

      const activeReqs = reqList.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;

      setMetrics({
        requests: reqs?.pagination?.total ?? reqList.length,
        activeRequests: activeReqs,
        customers: custs?.pagination?.total ?? 0,
        hospitals: hosps?.pagination?.total ?? hospList.length,
        services: svcs?.pagination?.total ?? svcList.length,
        support: supp?.pagination?.total ?? 0,
      });

      setRecentRequests(reqList);
      setLastRefreshedAt(new Date());
    } catch {
      // ignore transient poll error
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchLiveDashboard(false);

    // Low-latency live polling every 8 seconds
    const interval = setInterval(() => {
      if (mounted && document.visibilityState === 'visible') {
        fetchLiveDashboard(true);
      }
    }, 8000);

    const handleFocus = () => {
      if (mounted) fetchLiveDashboard(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchLiveDashboard]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.5rem 1.75rem',
        borderRadius: 'var(--ops-radius-xl)',
        backgroundColor: 'var(--ops-surface-container-lowest)',
        border: '1px solid var(--ops-outline-subtle)',
        boxShadow: 'var(--ops-shadow-sm)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ops-primary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
            <span>Bhimavaram Live Operations Desk</span>
            {lastRefreshedAt && (
              <span style={{ color: 'var(--ops-outline)', fontWeight: 500, textTransform: 'none' }}>
                • Synced {lastRefreshedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--ops-on-surface)', letterSpacing: '-0.015em' }}>
            Care Coordination Command Center
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ops-on-surface-variant)' }}>
            Real-time management for companion dispatch, partner hospitals, and live customer web content.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="ops-btn ops-btn-secondary"
            onClick={() => fetchLiveDashboard(false)}
            disabled={isRefreshing}
            title="Refresh live data from database"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            >
              sync
            </span>
            <span>{isRefreshing ? 'Refreshing…' : 'Sync Live'}</span>
          </button>
          <Link to="/requests" className="ops-btn ops-btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment</span>
            <span>View Requests</span>
          </Link>
          <Link to="/cms/blocks" className="ops-btn ops-btn-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_note</span>
            <span>Website CMS</span>
          </Link>
        </div>
      </div>

      {/* Bento Metrics Grid */}
      <div className="ops-metrics-grid">
        {/* Card 1: Requests */}
        <Link to="/requests" className="ops-metric-card" style={{ textDecoration: 'none' }}>
          <div className="ops-metric-top">
            <p className="ops-metric-label">Care Requests</p>
            <div className="ops-metric-icon-box">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>assignment</span>
            </div>
          </div>
          <p className="ops-metric-val">{loading ? '…' : metrics.requests}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--ops-primary)', fontWeight: 600 }}>
            {metrics.activeRequests} active in queue
          </span>
        </Link>

        {/* Card 2: Partner Hospitals */}
        <Link to="/hospitals" className="ops-metric-card" style={{ textDecoration: 'none' }}>
          <div className="ops-metric-top">
            <p className="ops-metric-label">Partner Hospitals</p>
            <div className="ops-metric-icon-box" style={{ backgroundColor: 'var(--ops-secondary-container)', color: 'var(--ops-on-secondary-container)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>local_hospital</span>
            </div>
          </div>
          <p className="ops-metric-val">{metrics.hospitals}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--ops-secondary)', fontWeight: 600 }}>
            Bhimavaram &amp; surrounding network
          </span>
        </Link>

        {/* Card 3: Care Services */}
        <Link to="/services" className="ops-metric-card" style={{ textDecoration: 'none' }}>
          <div className="ops-metric-top">
            <p className="ops-metric-label">Care Packages</p>
            <div className="ops-metric-icon-box" style={{ backgroundColor: 'var(--ops-success-container)', color: 'var(--ops-success)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>medical_services</span>
            </div>
          </div>
          <p className="ops-metric-val">{metrics.services}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--ops-success)', fontWeight: 600 }}>
            Catalog services live
          </span>
        </Link>

        {/* Card 4: Customers & Support */}
        <Link to="/support" className="ops-metric-card" style={{ textDecoration: 'none' }}>
          <div className="ops-metric-top">
            <p className="ops-metric-label">Support Queue</p>
            <div className="ops-metric-icon-box" style={{ backgroundColor: 'var(--ops-tertiary-fixed)', color: 'var(--ops-tertiary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>headset_mic</span>
            </div>
          </div>
          <p className="ops-metric-val">{metrics.support}</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)', fontWeight: 500 }}>
            24/7 Companion desk online
          </span>
        </Link>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Quick CMS Shortcuts */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h3 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>bolt</span>
              <span>Quick CMS &amp; Network Controls</span>
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Link
              to="/services/new"
              className="ops-btn ops-btn-secondary"
              style={{ padding: '0.875rem', justifyContent: 'flex-start', textAlign: 'left', gap: '0.5rem' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)', fontSize: '20px' }}>add_circle</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>Add Care Package</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)' }}>Create new service</span>
              </div>
            </Link>

            <Link
              to="/hospitals"
              className="ops-btn ops-btn-secondary"
              style={{ padding: '0.875rem', justifyContent: 'flex-start', textAlign: 'left', gap: '0.5rem' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)', fontSize: '20px' }}>apartment</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>Manage Hospitals</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)' }}>{metrics.hospitals} partner gates</span>
              </div>
            </Link>

            <Link
              to="/cms/blocks"
              className="ops-btn ops-btn-secondary"
              style={{ padding: '0.875rem', justifyContent: 'flex-start', textAlign: 'left', gap: '0.5rem' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)', fontSize: '20px' }}>dashboard_customize</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>Edit Content Blocks</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)' }}>Advisories &amp; copy</span>
              </div>
            </Link>

            <Link
              to="/cms/recipient-form"
              className="ops-btn ops-btn-secondary"
              style={{ padding: '0.875rem', justifyContent: 'flex-start', textAlign: 'left', gap: '0.5rem' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)', fontSize: '20px' }}>badge</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>Recipient Form Rules</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)' }}>Custom fields &amp; notes</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Care Requests */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h3 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>schedule</span>
              <span>Recent Care Dispatches</span>
            </h3>
            <Link to="/requests" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ops-primary)', textDecoration: 'none' }}>
              All Requests &rarr;
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ops-outline)', textAlign: 'center', padding: '1.5rem 0' }}>
              No active customer requests right now.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {recentRequests.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--ops-radius-md)',
                    backgroundColor: 'var(--ops-surface-container-low)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ops-on-surface)' }}>
                      {r.recipient?.name || 'Care Recipient'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
                      {r.hospital?.name || 'Hospital Visit'} • {r.appointment_date || 'Upcoming'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge value={r.status} />
                    <Link to={`/requests/${r.id}`} className="ops-btn ops-btn-secondary ops-btn-sm">
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
