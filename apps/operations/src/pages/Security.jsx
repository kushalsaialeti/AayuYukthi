import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorAlert, EmptyState } from '../components/ui.jsx';

// Severity ordering for the summary strip and filter pills.
const SEVERITIES = ['critical', 'high', 'medium', 'low'];

const SEVERITY_CARD = {
  critical: {
    icon: 'crisis_alert',
    iconStyle: { backgroundColor: 'var(--ops-error-container)', color: 'var(--ops-on-error-container)' },
  },
  high: {
    icon: 'report',
    iconStyle: { backgroundColor: 'var(--ops-tertiary-fixed)', color: 'var(--ops-tertiary)' },
  },
  medium: {
    icon: 'warning',
    iconStyle: { backgroundColor: '#fef3c7', color: '#92400e' },
  },
  low: {
    icon: 'info',
    iconStyle: { backgroundColor: 'var(--ops-surface-container-high)', color: 'var(--ops-outline)' },
  },
};

// Badge look per severity — reuses the app's existing badge palette.
function SeverityBadge({ severity }) {
  const v = (severity || 'low').toLowerCase();
  if (v === 'critical') {
    return (
      <span className="ops-badge ops-badge-error">
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>priority_high</span>
        <span>Critical</span>
      </span>
    );
  }
  if (v === 'high') {
    return (
      <span className="ops-badge" style={{ backgroundColor: 'var(--ops-tertiary-fixed)', color: 'var(--ops-tertiary)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>arrow_upward</span>
        <span>High</span>
      </span>
    );
  }
  if (v === 'medium') {
    return (
      <span className="ops-badge ops-badge-draft">
        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>drag_handle</span>
        <span>Medium</span>
      </span>
    );
  }
  return (
    <span className="ops-badge ops-badge-archived">
      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>arrow_downward</span>
      <span>Low</span>
    </span>
  );
}

// Renders detail jsonb as plain text only — attacker-controlled content is
// never interpreted as markup; samples are stringified into a pre block.
function EventDetails({ detail }) {
  if (!detail || typeof detail !== 'object') {
    return <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>No additional detail recorded.</span>;
  }
  const signatures = Array.isArray(detail.signatures) ? detail.signatures : [];
  const samples = Array.isArray(detail.samples) ? detail.samples : null;
  const shown = samples ?? detail;
  const shownLabel = samples ? 'Captured samples' : 'Event detail';

  const jsonText = (() => {
    const raw = JSON.stringify(shown, null, 2) ?? '';
    return raw.length > 600 ? `${raw.slice(0, 600)}…` : raw;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '24rem' }}>
      {signatures.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ops-outline)' }}>
            Matched signatures
          </span>
          {signatures.map((s, i) => (
            <code
              key={`${s}-${i}`}
              style={{
                padding: '0.15rem 0.4rem',
                backgroundColor: 'var(--ops-error-container)',
                color: 'var(--ops-on-error-container)',
                borderRadius: 'var(--ops-radius-sm)',
                fontSize: '0.75rem',
                width: 'fit-content',
              }}
            >
              {String(s)}
            </code>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ops-outline)' }}>
          {shownLabel}
        </span>
        <pre
          style={{
            margin: 0,
            padding: '0.5rem 0.625rem',
            backgroundColor: 'var(--ops-surface-container-low)',
            border: '1px solid var(--ops-outline-subtle)',
            borderRadius: 'var(--ops-radius-sm)',
            fontSize: '0.6875rem',
            lineHeight: 1.5,
            color: 'var(--ops-on-surface-variant)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '12rem',
            overflowY: 'auto',
          }}
        >
          {jsonText}
        </pre>
      </div>
    </div>
  );
}

export function Security() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState(null); // { data, pagination }
  const [filters, setFilters] = useState({ severity: '', event_type: '' });
  const [typeInput, setTypeInput] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  const load = async (f = filters, p = page) => {
    setError(null);
    setForbidden(false);
    setLoading(true);
    try {
      const params = { page: String(p), limit: '20' };
      if (f.severity) params.severity = f.severity;
      if (f.event_type.trim()) params.event_type = f.event_type.trim();
      const [sum, ev] = await Promise.all([
        api.securitySummary().catch((err) => {
          if (err.status === 403) throw err;
          return null; // summary is decorative; the feed below carries the page
        }),
        api.securityEvents(params),
      ]);
      setSummary(sum);
      setEvents(ev);
    } catch (err) {
      if (err.status === 403) setForbidden(true);
      else setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ severity: '', event_type: '' }, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySeverity = (severity) => {
    const f = { ...filters, severity };
    setFilters(f);
    setPage(1);
    load(f, 1);
  };

  const applyTypeFilter = (e) => {
    e.preventDefault();
    const f = { ...filters, event_type: typeInput };
    setFilters(f);
    setPage(1);
    load(f, 1);
  };

  const clearTypeFilter = () => {
    setTypeInput('');
    const f = { ...filters, event_type: '' };
    setFilters(f);
    setPage(1);
    load(f, 1);
  };

  const goToPage = (p) => {
    setPage(p);
    load(filters, p);
  };

  if (forbidden) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
          Security Monitor
        </h1>
        <div className="ops-card" style={{ backgroundColor: 'var(--ops-surface-container-low)', padding: '2rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--ops-outline)' }}>
            lock
          </span>
          <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>Access restricted — requires Operations Head role</p>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--ops-outline)', fontSize: '0.875rem' }}>
            Security event details include attacker IPs, paths, and probe payloads. They are only visible to Operations Head accounts.
          </p>
        </div>
      </div>
    );
  }

  const bySeverity = summary?.bySeverity ?? { low: 0, medium: 0, high: 0, critical: 0 };
  const total24h = summary?.total24h;
  const pagination = events?.pagination ?? null;
  const rows = events?.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
          Security Monitor
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
          Live alarm console for blocked attack attempts: SQL injection / XSS / path traversal probes, auth failures, rate-limit floods, and CORS blocks.
        </p>
      </div>

      {/* 24h alarm summary strip */}
      <div className="ops-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: '10rem' }}>
          <span className="ops-metric-val">{total24h ?? '—'}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)', fontWeight: 600 }}>
            events in last 24 hours
          </span>
        </div>
        <div className="ops-metrics-grid" style={{ flex: 1, minWidth: '280px' }}>
          {SEVERITIES.map((sev) => {
            const count = bySeverity[sev] ?? 0;
            const alarming = (sev === 'critical' || sev === 'high') && count > 0;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => applySeverity(filters.severity === sev ? '' : sev)}
                title={`Filter feed by ${sev} severity`}
                className={`ops-metric-card ${alarming ? 'ops-alarm-pulse' : ''}`}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  ...(alarming ? { borderColor: 'rgba(186, 26, 26, 0.35)' } : {}),
                }}
              >
                <div className="ops-metric-top">
                  <p className="ops-metric-label" style={{ textTransform: 'capitalize' }}>{sev}</p>
                  <div className="ops-metric-icon-box" style={SEVERITY_CARD[sev].iconStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{SEVERITY_CARD[sev].icon}</span>
                  </div>
                </div>
                <p className="ops-metric-val" style={alarming ? { color: 'var(--ops-error)' } : undefined}>{count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters: severity pills + exact event-type filter */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[{ key: '', label: 'All' }, ...SEVERITIES.map((s) => ({ key: s, label: s[0].toUpperCase() + s.slice(1) }))].map((opt) => (
            <button
              key={opt.key || 'all'}
              type="button"
              className={`ops-btn ops-btn-sm ${filters.severity === opt.key ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
              onClick={() => applySeverity(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form onSubmit={applyTypeFilter} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            className="ops-input"
            style={{ maxWidth: '260px' }}
            placeholder="Event type (e.g. SQL_INJECTION)"
            title="Exact event type match, e.g. SQL_INJECTION, XSS, AUTH_FAILURE, RATE_LIMITED_API, CORS_BLOCKED"
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
          />
          <button className="ops-btn ops-btn-secondary" type="submit">Apply</button>
          {typeInput && (
            <button
              className="ops-btn ops-btn-secondary"
              type="button"
              onClick={clearTypeFilter}
            >
              Clear
            </button>
          )}
        </form>
        <div style={{ marginLeft: 'auto' }}>
          <button className="ops-btn ops-btn-secondary" type="button" onClick={() => load()} disabled={loading}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }}
            >
              sync
            </span>
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <ErrorAlert error={error} onRetry={() => load()} />

      {!events && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading security events…</p>
        </div>
      )}

      {events && rows.length === 0 && (
        <EmptyState
          icon="shield"
          title="No security events recorded"
          message={filters.severity || filters.event_type
            ? 'Nothing matches this filter — the perimeter is quiet here.'
            : 'No attack attempts have been intercepted in the recorded window. Stay vigilant.'}
        />
      )}

      {events && rows.length > 0 && (
        <div className="ops-table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Event type</th>
                <th>IP</th>
                <th>Method &amp; Path</th>
                <th>Request ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ops-outline)' }}>
                    Refreshing security events…
                  </td>
                </tr>
              )}
              {!loading && rows.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ops-on-surface)', whiteSpace: 'nowrap' }}>
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <SeverityBadge severity={ev.severity} />
                  </td>
                  <td>
                    <code
                      style={{
                        padding: '0.2rem 0.4rem',
                        backgroundColor: 'var(--ops-surface-container-high)',
                        borderRadius: 'var(--ops-radius-sm)',
                        color: 'var(--ops-primary)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {ev.event_type}
                    </code>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ops-on-surface)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {ev.ip ?? '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)', wordBreak: 'break-all' }}>
                      <strong>{ev.method ?? '—'}</strong> {ev.path ?? ''}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)' }}>
                      {ev.request_id ?? '—'}
                    </code>
                  </td>
                  <td>
                    <details>
                      <summary style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ops-primary)' }}>
                        View
                      </summary>
                      <div style={{ marginTop: '0.5rem' }}>
                        <EventDetails detail={ev.detail} />
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && rows.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} · {pagination.total} event{pagination.total === 1 ? '' : 's'} recorded
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="ops-btn ops-btn-secondary ops-btn-sm"
              type="button"
              disabled={loading || pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              <span>Prev</span>
            </button>
            <button
              className="ops-btn ops-btn-secondary ops-btn-sm"
              type="button"
              disabled={loading || pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.page + 1)}
            >
              <span>Next</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
