import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorAlert, EmptyState } from '../components/ui.jsx';

export function AuditLogs() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [filters, setFilters] = useState({ action: '', entity_type: '' });

  const load = async (f = filters) => {
    setError(null);
    setForbidden(false);
    try {
      const params = { page: '1', limit: '50' };
      if (f.action) params.action = f.action;
      if (f.entity_type) params.entity_type = f.entity_type;
      setData(await api.list('audit-logs', params));
    } catch (err) {
      if (err.status === 403) setForbidden(true);
      else setError(err);
    }
  };

  useEffect(() => {
    load({ action: '', entity_type: '' });
  }, []);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  if (forbidden) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
          Audit Trail
        </h1>
        <div className="ops-card" style={{ backgroundColor: 'var(--ops-surface-container-low)', padding: '2rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--ops-outline)' }}>
            lock
          </span>
          <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>Access Restricted</p>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--ops-outline)', fontSize: '0.875rem' }}>
            Audit trail inspection requires Operations Head or Compliance privileges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
          Compliance &amp; Operational Audit Trail
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
          Immutable append-only record of all operational dispatches, CMS edits, status progressions, and staff actions.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          className="ops-input"
          style={{ maxWidth: '240px' }}
          placeholder="Filter by action (e.g. UPDATE)"
          value={filters.action}
          onChange={set('action')}
        />
        <input
          className="ops-input"
          style={{ maxWidth: '240px' }}
          placeholder="Filter by entity (e.g. requests)"
          value={filters.entity_type}
          onChange={set('entity_type')}
        />
        <button className="ops-btn ops-btn-secondary" type="submit">
          Apply Filter
        </button>
      </form>

      <ErrorAlert error={error} onRetry={() => load()} />

      {!data && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading audit trail…</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState message="No audit entries recorded matching this filter." />
      )}

      {data && data.data.length > 0 && (
        <div className="ops-table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Staff Actor</th>
                <th>Operation Action</th>
                <th>Target Entity</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ops-on-surface)' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="ops-badge ops-badge-active" style={{ textTransform: 'capitalize' }}>
                      {a.actor_role ?? 'system'}
                    </span>
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
                      {a.action}
                    </code>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ops-outline)' }}>
                      {a.entity_type ?? '—'}
                      {a.entity_id ? ` · ${String(a.entity_id).slice(0, 8)}…` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
