import React from 'react';
import { Link } from 'react-router-dom';

export function RecipientBanner({ config, onBackToList }) {
  const banner = config?.banner || {};
  const trustPills = banner.trustPills || [];

  return (
    <>
      {/* Breadcrumb & Top Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '13px', color: 'var(--rf-text-muted)' }}>
          <button
            type="button"
            onClick={onBackToList}
            style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', font: 'inherit' }}
            className="hover-underline"
          >
            Care Recipients
          </button>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--rf-outline)' }}>
            chevron_right
          </span>
          <span style={{ color: 'var(--rf-text)', fontWeight: 600 }}>Add New Recipient</span>
        </nav>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--rf-secondary-container)',
          color: 'var(--rf-on-secondary-fixed)',
          fontSize: '11px',
          fontWeight: 600
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--rf-surface-tint)' }}>
            verified_user
          </span>
          <span>Non-Clinical Profile • Encrypted Healthcare Data Storage</span>
        </div>
      </div>

      {/* Header Section with Visual Banner Component */}
      <div className="rf-banner">
        <div className="rf-banner-content">
          <span className="rf-step-tag">{banner.step || 'Step 1 of Care Setup'}</span>
          <h1 className="rf-banner-title">{banner.title || 'Add Care Recipient'}</h1>
          <p className="rf-banner-desc">
            {banner.description || 'Enter essential details to customize hospital accompaniment, wheelchair logistics, and caregiver communication during critical transit and OPD consultations.'}
          </p>
        </div>

        {/* Trust Indicator Pills */}
        <div className="rf-trust-pills">
          {trustPills.map((pill, idx) => (
            <React.Fragment key={pill.text || idx}>
              <div className="rf-trust-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--rf-surface-tint)' }}>
                  {pill.icon}
                </span>
                <span>{pill.text}</span>
              </div>
              {idx < trustPills.length - 1 && <div className="rf-trust-divider" />}
            </React.Fragment>
          ))}
        </div>

        {/* Decorative Ambient Gradient Mesh */}
        <div className="rf-ambient-1" aria-hidden="true" />
        <div className="rf-ambient-2" aria-hidden="true" />
      </div>
    </>
  );
}
