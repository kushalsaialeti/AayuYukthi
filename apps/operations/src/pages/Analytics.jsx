import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ErrorAlert } from '../components/ui.jsx';

const RANGES = [
  ['7', 'Last 7 Days'],
  ['30', 'Last 30 Days'],
  ['90', 'Last 90 Days'],
];

const FUNNELS = [
  ['overall', 'Overall Journey'],
  ['signup', 'Account Registration'],
  ['onboarding', 'Onboarding & Family Setup'],
  ['request', 'Care Request Booking'],
];

const pretty = (s) => (s ? s.replaceAll('_', ' ') : '');

export function Analytics() {
  const [days, setDays] = useState('30');
  const [funnelType, setFunnelType] = useState('overall');
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [services, setServices] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    Promise.all([
      api.getOne(`analytics/overview?days=${days}`).catch(() => null),
      api.getOne(`analytics/funnel/${funnelType}?days=${days}`).catch(() => null),
      api.getOne('analytics/dropoff').catch(() => null),
      api.getOne(`analytics/services?days=${days}`).catch(() => null),
      api.getOne(`analytics/languages?days=${days}`).catch(() => null),
    ])
      .then(([o, f, d, s, l]) => {
        setOverview(o);
        setFunnel(f);
        setDropoff(d);
        setServices(s);
        setLanguages(l);
      })
      .catch(setError);
  }, [days, funnelType]);

  const maxStep = Math.max(1, ...(funnel?.steps ?? []).map((s) => s.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Title & Range selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            Operations &amp; Growth Analytics
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Real-time telemetry, accompaniment funnel conversions, and engagement metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {RANGES.map(([d, label]) => (
            <button
              key={d}
              type="button"
              className={`ops-btn ops-btn-sm ${days === d ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
              onClick={() => setDays(d)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ErrorAlert error={error} />

      {!overview && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Aggregating analytics data…</p>
        </div>
      )}

      {/* Bento Metric Counters */}
      {overview && (
        <div className="ops-metrics-grid">
          <div className="ops-metric-card">
            <div className="ops-metric-top">
              <span className="ops-metric-label">Public Page Views</span>
              <div className="ops-metric-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
              </div>
            </div>
            <p className="ops-metric-val">{overview.counts.PAGE_VIEWED ?? 0}</p>
          </div>

          <div className="ops-metric-card">
            <div className="ops-metric-top">
              <span className="ops-metric-label">Anonymous Visitors</span>
              <div className="ops-metric-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>public</span>
              </div>
            </div>
            <p className="ops-metric-val">{overview.visitors.anonymousSessions ?? 0}</p>
          </div>

          <div className="ops-metric-card">
            <div className="ops-metric-top">
              <span className="ops-metric-label">Signed-in Families</span>
              <div className="ops-metric-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>group</span>
              </div>
            </div>
            <p className="ops-metric-val">{overview.visitors.authenticatedUsers ?? 0}</p>
          </div>

          <div className="ops-metric-card">
            <div className="ops-metric-top">
              <span className="ops-metric-label">Completed Registrations</span>
              <div className="ops-metric-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>how_to_reg</span>
              </div>
            </div>
            <p className="ops-metric-val">{overview.counts.REGISTRATION_COMPLETED ?? 0}</p>
          </div>

          <div className="ops-metric-card">
            <div className="ops-metric-top">
              <span className="ops-metric-label">Care Requests Submitted</span>
              <div className="ops-metric-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>medical_services</span>
              </div>
            </div>
            <p className="ops-metric-val" style={{ color: 'var(--ops-primary)' }}>
              {overview.counts.REQUEST_SUBMITTED ?? 0}
            </p>
          </div>

          <div className="ops-metric-card">
            <div className="ops-metric-top">
              <span className="ops-metric-label">Support Inquiries</span>
              <div className="ops-metric-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>support_agent</span>
              </div>
            </div>
            <p className="ops-metric-val">{overview.counts.SUPPORT_REQUEST_CREATED ?? 0}</p>
          </div>
        </div>
      )}

      {/* Funnel Conversion Tracker */}
      <div className="ops-card">
        <div className="ops-card-header">
          <h2 className="ops-card-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
              filter_alt
            </span>
            Conversion Funnels
          </h2>
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
            {FUNNELS.map(([f, label]) => (
              <button
                key={f}
                type="button"
                className={`ops-btn ops-btn-sm ${funnelType === f ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
                onClick={() => setFunnelType(f)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {funnel && funnel.steps && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {funnel.steps.map((s, idx) => {
              const pct = Math.round((s.count / maxStep) * 100);
              return (
                <div
                  key={s.event}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--ops-surface-container-low)',
                    borderRadius: 'var(--ops-radius-md)',
                    border: '1px solid var(--ops-outline-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ops-primary-container)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--ops-on-surface)' }}>
                        {pretty(s.event)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ops-primary)' }}>
                        {s.count} events
                      </span>
                      {s.conversionFromPrevious != null && (
                        <span className="ops-badge ops-badge-confirmed">
                          {s.conversionFromPrevious}% conversion
                        </span>
                      )}
                      {s.dropped > 0 && (
                        <span style={{ color: 'var(--ops-outline)' }}>
                          (−{s.dropped} dropped)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--ops-surface-container-high)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '4px',
                        width: `${Math.max(4, pct)}%`,
                        backgroundColor: 'var(--ops-primary-container)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Engagement Insights: Services & Languages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Top Services Views */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                trending_up
              </span>
              Top Viewed Accompaniment Services
            </h2>
          </div>

          {(!services || !services.views || services.views.length === 0) ? (
            <p style={{ margin: 0, color: 'var(--ops-outline)' }}>No views logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {services.views.map((s) => (
                <div
                  key={s.slug}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid var(--ops-outline-subtle)',
                    borderRadius: 'var(--ops-radius-md)',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.slug}</span>
                  <span className="ops-badge ops-badge-active">{s.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language Breakdown */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                translate
              </span>
              Language Engagement
            </h2>
          </div>

          {(!languages || languages.length === 0) ? (
            <p style={{ margin: 0, color: 'var(--ops-outline)' }}>No language switches recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {languages.map((l) => (
                <div
                  key={l.locale}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid var(--ops-outline-subtle)',
                    borderRadius: 'var(--ops-radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)', fontSize: '20px' }}>
                      language
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {l.locale === 'te' ? 'తెలుగు (Telugu)' : 'English'}
                    </span>
                  </div>
                  <span className="ops-badge ops-badge-confirmed">{l.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
