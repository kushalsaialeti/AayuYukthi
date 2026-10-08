import React from 'react';
import { Link } from 'react-router-dom';
import { RecipientSelectionCard } from './RecipientSelectionCard.jsx';

export function RequestCareStep1Recipient({
  recipients = [],
  selectedRecipientId,
  onSelectRecipient,
  onContinue,
  onExit,
  cmsConfig = {},
}) {
  const stepBadge = cmsConfig.step1_badge || 'STEP 1 OF 7 • WHO NEEDS CARE?';
  const stepTitle = cmsConfig.step1_title || 'Select the family member visiting the hospital';
  const stepDesc = cmsConfig.step1_desc ||
    "We will tailor mobility equipment, companion dialect, and hospital desk coordination based on the recipient's registered health profile.";

  const guestNoticeTitle = cmsConfig.guest_title || 'Booking for a visiting friend or urgent guest?';
  const guestNoticeBody = cmsConfig.guest_body ||
    'You can register a temporary guest profile without health records. All hospital escort notes and medical summaries will be securely dispatched to your logged-in caregiver phone.';

  const hasValidRecipient = Boolean(
    selectedRecipientId &&
    recipients &&
    recipients.length > 0 &&
    recipients.some((r) => r.id === selectedRecipientId)
  );

  return (
    <section className="rc-step-panel">
      {/* Step Header Block */}
      <div className="rc-step-header-block">
        <div className="rc-step-chip">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            person_check
          </span>
          <span>{stepBadge}</span>
        </div>
        <h1 className="rc-step-title">{stepTitle}</h1>
        <p className="rc-step-desc">{stepDesc}</p>
      </div>

      {/* Recipient Cards Stack */}
      <div className="rc-recipient-cards-stack" role="radiogroup" aria-label="Care Recipients">
        {recipients.length === 0 ? (
          <div style={{
            padding: '2.5rem 1.5rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--cust-surface-container-lowest, #ffffff)',
            border: '1px dashed var(--cust-outline-variant, #bfc8c9)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--cust-surface-container-low, #f2f4f3)',
              color: 'var(--cust-primary, #004349)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>group_add</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              No care recipients registered yet
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cust-on-surface-variant)', maxWidth: '26rem' }}>
              Add your parent or family member profile first to personalize hospital coordination, wheelchair support, and doctor summaries.
            </p>
            <Link
              to="/app/recipients/new?redirect=/request-care"
              className="cust-btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
              <span>Add First Recipient (60s)</span>
            </Link>
          </div>
        ) : (
          recipients.map((rec, index) => (
            <RecipientSelectionCard
              key={rec.id}
              recipient={rec}
              isSelected={selectedRecipientId === rec.id}
              onSelect={() => onSelectRecipient(rec.id)}
              isPrimary={index === 0}
            />
          ))
        )}
      </div>

      {/* Action: Add New Profile Card */}
      <Link
        to="/app/recipients/new?redirect=/request-care"
        className="rc-add-profile-btn"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="rc-add-icon-box">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              person_add
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-primary)' }}>
              + Add a new care recipient profile
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)' }}>
              Setup basic health ID, mobility assistance requirement, and address in 60s.
            </span>
          </div>
        </div>

        <span
          className="material-symbols-outlined"
          style={{ color: 'var(--cust-outline)', fontSize: '22px' }}
        >
          chevron_right
        </span>
      </Link>

      {/* Information / Guest Notice Box */}
      <div className="rc-guest-notice-box">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '22px', color: 'var(--cust-primary)', flexShrink: 0, marginTop: '2px' }}
        >
          info
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            {guestNoticeTitle}
          </span>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
            {guestNoticeBody}
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="rc-step-actions-bar">
        <button
          type="button"
          onClick={onExit}
          className="cust-btn-secondary"
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            close
          </span>
          <span>Exit / Save for Later</span>
        </button>

        <button
          type="button"
          disabled={!hasValidRecipient}
          onClick={(e) => {
            if (!hasValidRecipient) {
              e.preventDefault();
              return;
            }
            onContinue();
          }}
          className="rc-btn-continue"
          title={!hasValidRecipient ? 'Please add and select a recipient to continue' : 'Continue to service selection'}
        >
          <span>Continue to Service Selection</span>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_forward
          </span>
        </button>
      </div>
    </section>
  );
}
