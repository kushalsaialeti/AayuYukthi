import React from 'react';
import { Link } from 'react-router-dom';

export function DashboardHospitalGuidesWidget({ hospitals = [] }) {
  const displayHospitals = hospitals.slice(0, 3);

  return (
    <div className="cust-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
          Hospital Navigation Guides
        </h3>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--cust-secondary)' }}>
          Pre-scouted Gate Protocols
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {displayHospitals.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
            Loading Bhimavaram hospital protocols…
          </p>
        ) : (
          displayHospitals.map((h) => {
            const rawHighlight = h.campus_highlight_en || h.wait_info_en || 'Rendezvous: Gate 1 Main Porch. Direct wheelchair ramp to OP Consultation Blocks.';
            const highlight = typeof rawHighlight === 'string' ? rawHighlight : String(rawHighlight?.body_en || rawHighlight?.title_en || '');
            const hospName = h.name_en || h.name || 'Partner Hospital';

            return (
              <div key={h.id || h.slug} className="dash-hospital-guide-card">
                <div style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--cust-surface-container-high)',
                  color: 'var(--cust-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    domain
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hospName}
                    </span>
                    <Link
                      to={`/hospitals/${h.slug}`}
                      style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cust-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      View Details
                    </Link>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    {highlight}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
