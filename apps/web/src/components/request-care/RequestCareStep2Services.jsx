import React from 'react';

export function RequestCareStep2Services({
  services = [],
  selectedServiceIds = [],
  onToggleService,
  onBack,
  onContinue,
  canContinue,
  tx,
}) {
  const selectedCount = selectedServiceIds.length;

  return (
    <section className="rc-step-panel">
      {/* Header Block */}
      <div className="rc-step-header-block">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="rc-step-chip">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              medical_services
            </span>
            <span>STEP 2 OF 7 • CARE SERVICES (MULTI-SELECT)</span>
          </div>

          {selectedCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 67, 73, 0.1)',
              color: 'var(--cust-primary)',
              fontSize: '0.8125rem',
              fontWeight: 700,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
              <span>{selectedCount} {selectedCount === 1 ? 'Service' : 'Services'} Selected</span>
            </span>
          )}
        </div>

        <h1 className="rc-step-title">Choose care accompaniment services</h1>
        <p className="rc-step-desc">
          Select one or more services needed for this hospital journey. You can combine accompaniment, transit, diagnostics support, and billing coordination.
        </p>
      </div>

      {/* Services Multi-Select List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {services.length === 0 ? (
          <div style={{
            padding: '2.5rem 1.5rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--cust-surface-container-lowest)',
            border: '1px dashed var(--cust-outline-variant)',
            textAlign: 'center',
            color: 'var(--cust-on-surface-variant)',
          }}>
            <p>Loading available care coordination services…</p>
          </div>
        ) : (
          services.map((s) => {
            const isSel = selectedServiceIds.includes(s.id);
            const title = tx ? tx('services', s.id, 'title_en', s.title_en) : s.title_en;
            const desc = s.description_en || s.summary_en || 'Full accompaniment and navigation';

            return (
              <div
                key={s.id}
                onClick={() => onToggleService(s.id)}
                className={`rc-recipient-card ${isSel ? 'is-selected' : ''}`}
                style={{
                  cursor: 'pointer',
                  padding: '1.15rem 1.25rem',
                  borderRadius: '1rem',
                  border: isSel
                    ? '2px solid var(--cust-primary, #004349)'
                    : '1px solid var(--cust-outline-variant, #bfc8c9)',
                  backgroundColor: isSel
                    ? 'rgba(0, 67, 73, 0.03)'
                    : 'var(--cust-surface-container-lowest, #ffffff)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSel ? '0 2px 8px rgba(0, 67, 73, 0.08)' : 'none',
                }}
                role="checkbox"
                aria-checked={isSel}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onToggleService(s.id);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                    <div
                      className="rc-logo-box"
                      style={{
                        width: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '0.75rem',
                        backgroundColor: isSel ? 'var(--cust-primary, #004349)' : 'var(--cust-surface-container-high, #e6e9e8)',
                        color: isSel ? '#ffffff' : 'var(--cust-primary, #004349)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                        {s.icon || 'medical_services'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
                          {title}
                        </h3>
                        {s.category && (
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--cust-surface-container, #eceeed)',
                            color: 'var(--cust-secondary, #4b6077)',
                          }}>
                            {s.category}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                        {desc.length > 130 ? `${desc.slice(0, 130)}…` : desc}
                      </span>
                    </div>
                  </div>

                  {/* Multi-select Checkbox Indicator */}
                  <div
                    style={{
                      width: '1.65rem',
                      height: '1.65rem',
                      borderRadius: '0.375rem',
                      border: isSel
                        ? '2px solid var(--cust-primary, #004349)'
                        : '2px solid var(--cust-outline, #6f797a)',
                      backgroundColor: isSel ? 'var(--cust-primary, #004349)' : 'transparent',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSel && (
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', fontWeight: 700 }}>
                        check
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions Bar */}
      <div className="rc-step-actions-bar" style={{ marginTop: '1.75rem' }}>
        <button type="button" onClick={onBack} className="cust-btn-secondary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          <span>Back to Recipient</span>
        </button>

        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="rc-btn-continue"
          style={{
            opacity: canContinue ? 1 : 0.5,
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          <span>Continue to Hospital ({selectedCount})</span>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
