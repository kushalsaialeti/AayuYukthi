import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorAlert, EmptyState } from '../components/ui.jsx';

export function CustomersList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');

  const load = async () => {
    setError(null);
    try {
      setData(await api.list('customers', q ? { q } : {}));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            Customers &amp; Families
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Registered customer accounts, family care recipients, and accompanied booking histories.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: '0.75rem', maxWidth: '480px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
            placeholder="Search by customer name, email, or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="ops-btn ops-btn-secondary" type="submit">
          Search
        </button>
      </form>

      <ErrorAlert error={error} onRetry={load} />

      {!data && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading customer directory…</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState message="No customer accounts found matching your query." />
      )}

      {data && data.data.length > 0 && (
        <div className="ops-table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact Info</th>
                <th>Bookings Count</th>
                <th>Onboarding Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ops-primary-fixed)',
                          color: 'var(--ops-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          flexShrink: 0,
                        }}
                      >
                        {c.full_name ? c.full_name[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ops-on-surface)' }}>{c.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>ID: {c.id.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--ops-on-surface)' }}>
                      {c.email || c.phone_e164 || '—'}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--ops-radius-pill)',
                        backgroundColor: 'var(--ops-surface-container-high)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {c.request_count} bookings
                    </span>
                  </td>
                  <td>
                    <span
                      className="ops-badge"
                      style={{
                        backgroundColor: c.onboarding_completed_at ? 'var(--ops-success-container)' : '#fef3c7',
                        color: c.onboarding_completed_at ? 'var(--ops-success)' : '#92400e',
                      }}
                    >
                      {c.onboarding_completed_at ? 'Completed' : c.onboarding_last_step || 'In Progress'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/customers/${c.id}`}
                      className="ops-btn ops-btn-secondary ops-btn-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                      View Account
                    </Link>
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

export function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('customers', id).then(setCustomer).catch(setError);
  }, [id]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link to="/customers" className="ops-btn ops-btn-secondary ops-btn-sm" style={{ width: 'fit-content' }}>
          ← Back to Customers
        </Link>
        <ErrorAlert error={error} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading customer details…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Link
          to="/customers"
          className="ops-btn ops-btn-secondary ops-btn-sm"
          style={{ width: 'fit-content', marginBottom: '0.75rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Customers
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-outline)', textTransform: 'uppercase' }}>
              Customer Account
            </span>
            <h1 style={{ margin: '0.2rem 0 0', fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
              {customer.full_name}
            </h1>
          </div>
          <span className="ops-badge ops-badge-active" style={{ fontSize: '0.875rem', padding: '0.35rem 0.75rem' }}>
            {customer.status || 'Active'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                account_circle
              </span>
              Account Information
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--ops-outline-subtle)' }}>
              <span style={{ color: 'var(--ops-outline)', fontSize: '0.8125rem' }}>Email Address</span>
              <span style={{ fontWeight: 600 }}>{customer.email || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--ops-outline-subtle)' }}>
              <span style={{ color: 'var(--ops-outline)', fontSize: '0.8125rem' }}>Phone Number</span>
              <span style={{ fontWeight: 600 }}>{customer.phone_e164 || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--ops-outline-subtle)' }}>
              <span style={{ color: 'var(--ops-outline)', fontSize: '0.8125rem' }}>Language / Locale</span>
              <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{customer.locale || 'en'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ color: 'var(--ops-outline)', fontSize: '0.8125rem' }}>Onboarding Status</span>
              <span className="ops-badge ops-badge-confirmed">
                {customer.onboarding_completed_at ? 'Fully Completed' : customer.onboarding_last_step || 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Care Recipients Card */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                diversity_1
              </span>
              Registered Care Recipients
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
              {customer.recipients?.length || 0} registered
            </span>
          </div>

          {(!customer.recipients || customer.recipients.length === 0) ? (
            <p style={{ margin: 0, color: 'var(--ops-outline)', fontSize: '0.875rem' }}>
              No family members registered under this account yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {customer.recipients.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '0.875rem',
                    backgroundColor: 'var(--ops-surface-container-low)',
                    borderRadius: 'var(--ops-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--ops-primary-container)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {r.full_name ? r.full_name[0].toUpperCase() : 'R'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{r.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
                        Relationship: {r.relationship}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking History Card */}
      <div className="ops-card">
        <div className="ops-card-header">
          <h2 className="ops-card-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              event_note
            </span>
            Booking &amp; Care Accompaniment History
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>
            {customer.requests?.length || 0} total bookings
          </span>
        </div>

        {(!customer.requests || customer.requests.length === 0) ? (
          <p style={{ margin: 0, color: 'var(--ops-outline)', fontSize: '0.875rem' }}>
            No care requests initiated by this account yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {customer.requests.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--ops-outline-subtle)',
                  borderRadius: 'var(--ops-radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ops-primary)' }}>
                    {r.service_title}
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'var(--ops-on-surface-variant)' }}>
                    {r.hospital_name} · Status: {r.status.replaceAll('_', ' ')}
                  </p>
                </div>
                <Link
                  to={`/requests/${r.id}`}
                  className="ops-btn ops-btn-secondary ops-btn-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                  View Dispatch
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
