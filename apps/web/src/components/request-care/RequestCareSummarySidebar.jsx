import React from 'react';

function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Number.isNaN(age) || age < 0 ? null : age;
}

function getInitials(name) {
  if (!name) return 'CR';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function RequestCareSummarySidebar({
  draftId = 'AY-4091',
  selectedRecipient,
  selectedService,
  selectedServices = [],
  selectedHospital,
  appointmentDate,
  helplinePhone = '1800-AAYU-CARE',
  cmsPricing = {},
}) {
  const recipientName = selectedRecipient?.full_name || selectedRecipient?.name;
  const recipientAge = calculateAge(selectedRecipient?.date_of_birth);
  const recipientRel = selectedRecipient?.relationship || 'Family Member';
  const recipientCity = selectedRecipient?.city || 'Bhimavaram';

  // Effective services list
  const activeServices = selectedServices.length > 0
    ? selectedServices
    : (selectedService ? [selectedService] : []);

  const cleanHelpline = typeof helplinePhone === 'object'
    ? (helplinePhone.body_en || helplinePhone.title_en || '1800-AAYU-CARE')
    : String(helplinePhone || '1800-AAYU-CARE');

  const priceRange = cmsPricing.range || '₹1,250 – ₹2,400';
  const priceUnit = cmsPricing.unit || '/ 4 hr session';
  const priceNote = cmsPricing.note ||
    'Exact pricing reflects travel distance, dedicated duration, and specialized wheelchair handling.';

  return (
    <aside className="rc-summary-aside">
      <div className="rc-summary-card">
        {/* Header */}
        <div className="rc-summary-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-primary)' }}>
              receipt_long
            </span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--cust-on-surface)' }}>
              Care Request Summary
            </h3>
          </div>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--cust-secondary-container)',
            color: 'var(--cust-on-secondary-container)'
          }}>
            Draft #{draftId}
          </span>
        </div>

        {/* Step 1 Chosen Recipient Capsule */}
        <div className="rc-summary-capsule">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--cust-outline)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step 1 • Recipient
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: selectedRecipient ? 'var(--cust-primary)' : 'var(--cust-outline)'
            }}>
              {selectedRecipient ? 'Selected' : 'Pending'}
            </span>
          </div>

          {selectedRecipient ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.25rem' }}>
                <div className="rc-capsule-avatar">
                  {getInitials(recipientName)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cust-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {recipientName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cust-on-surface-variant)' }}>
                    {recipientAge ? `${recipientAge}y • ` : ''}{recipientRel} • {recipientCity}
                  </span>
                </div>
              </div>

              <div style={{
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--cust-tertiary-container)',
                fontWeight: 600
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  accessible
                </span>
                <span>Hospital Mobility Protocol Synced</span>
              </div>
            </>
          ) : (
            <div style={{ padding: '0.5rem 0', fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
              Select a family member on the left to begin your customized request.
            </div>
          )}
        </div>

        {/* Upcoming Steps Preview */}
        <div className="rc-pending-steps-stack">
          {/* Step 2: Services (Multi) */}
          <div className="rc-pending-step-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--cust-on-surface-variant)', minWidth: 0, flex: 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-outline)', marginTop: '2px' }}>
                medical_services
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {activeServices.length > 0 ? (
                  activeServices.map((svc) => (
                    <span key={svc.id} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                      • {svc.title_en || svc.title}
                    </span>
                  ))
                ) : (
                  <span>Care Services</span>
                )}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-outline)', fontStyle: activeServices.length > 0 ? 'normal' : 'italic', whiteSpace: 'nowrap' }}>
              {activeServices.length > 0 ? `${activeServices.length} Selected` : 'Pending Step 2'}
            </span>
          </div>

          {/* Step 3: Hospital */}
          <div className="rc-pending-step-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cust-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-outline)' }}>
                local_hospital
              </span>
              <span>{selectedHospital?.name_en || selectedHospital?.name || 'Hospital & Doctor'}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-outline)', fontStyle: selectedHospital ? 'normal' : 'italic' }}>
              {selectedHospital ? 'Selected' : 'Pending Step 3'}
            </span>
          </div>

          {/* Step 4: Schedule */}
          <div className="rc-pending-step-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cust-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-outline)' }}>
                calendar_month
              </span>
              <span>{appointmentDate || 'Date & Schedule'}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-outline)', fontStyle: appointmentDate ? 'normal' : 'italic' }}>
              {appointmentDate ? 'Selected' : 'Pending Step 4'}
            </span>
          </div>

          {/* Steps 5–7 Group */}
          <div className="rc-pending-step-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cust-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-outline)' }}>
                shield_with_heart
              </span>
              <span>Directives &amp; Escort</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cust-outline)', fontStyle: 'italic' }}>
              Steps 5–7
            </span>
          </div>
        </div>

        {/* Pricing Box */}
        <div className="rc-pricing-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--cust-outline)', textTransform: 'uppercase' }}>
              Estimated Base Fee
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cust-primary)' }}>
              Step 2 Calculated
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
            <span className="rc-pricing-val">{priceRange}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-outline)' }}>{priceUnit}</span>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.4 }}>
            {priceNote}
          </p>
        </div>

        {/* Trust Assurances */}
        <div className="rc-assurances-list">
          <div className="rc-assurance-item">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
              verified
            </span>
            <span>100% Police-verified &amp; BLS-trained companions</span>
          </div>
          <div className="rc-assurance-item">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
              cancel
            </span>
            <span>Zero cancellation fee up to 4 hrs prior</span>
          </div>
          <div className="rc-assurance-item">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
              support_agent
            </span>
            <span>Direct companion call &amp; live coordinator desk</span>
          </div>
        </div>

        {/* Dedicated Assistance Box */}
        <div className="rc-assistance-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-primary)' }}>
              phone_in_talk
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cust-primary)' }}>
                Have questions?
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--cust-on-surface-variant)' }}>
                Call {cleanHelpline}
              </span>
            </div>
          </div>
          <a
            href={`tel:${cleanHelpline.replace(/[^0-9]/g, '') || '1800229822'}`}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--cust-primary)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Call Now
          </a>
        </div>
      </div>

      {/* Non-clinical Notice Note */}
      <p style={{
        margin: '0.75rem 0 0',
        fontSize: '0.75rem',
        color: 'var(--cust-outline)',
        textAlign: 'center',
        lineHeight: 1.5,
        padding: '0 0.5rem'
      }}>
        AayuYukthi provides non-clinical companionship, mobility handling, and logistical liaison. We do not provide acute clinical or emergency ambulance operations.
      </p>
    </aside>
  );
}
