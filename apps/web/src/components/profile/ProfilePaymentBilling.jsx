import React, { useState } from 'react';

export function ProfilePaymentBilling({
  cmsPolicyTitle = '',
  cmsPolicyDesc = '',
  savedMethods = null,
  gstin = '',
  invoicingEntity = '',
  onSaveBilling,
}) {
  const [methods, setMethods] = useState(savedMethods || [
    {
      id: 'pm_card_1',
      type: 'card',
      title: 'HDFC Bank Corporate Visa',
      subtitle: 'Ending in •••• 4092 • Expires 09/28',
      isDefault: true,
      tag: 'Tokenized (RBI Compliant)',
    },
    {
      id: 'pm_upi_1',
      type: 'upi',
      title: 'UPI ID (Instant Auto-Debit)',
      subtitle: 'anand.murthy@okhdfcbank',
      isDefault: false,
      tag: null,
    },
  ]);

  const [currentGstin, setCurrentGstin] = useState(gstin || '29AAAAA0000A1Z5 (Karnataka)');
  const [currentEntity, setCurrentEntity] = useState(invoicingEntity || 'Murthy Family Healthcare Trust');
  const [isAdding, setIsAdding] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');

  const makeDefault = (id) => {
    setMethods((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
  };

  const removeMethod = (id) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddUpi = (e) => {
    e.preventDefault();
    if (!newUpiId.trim()) return;
    setMethods((prev) => [
      ...prev,
      {
        id: `pm_upi_${Date.now()}`,
        type: 'upi',
        title: 'UPI ID (Instant Auto-Debit)',
        subtitle: newUpiId.trim(),
        isDefault: prev.length === 0,
        tag: null,
      },
    ]);
    setNewUpiId('');
    setIsAdding(false);
  };

  return (
    <div className="profile-section-card" id="section-payment">
      {/* Header */}
      <div className="profile-section-header">
        <div className="profile-section-title-group">
          <div className="profile-section-icon-box">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>payments</span>
          </div>
          <div>
            <h3 className="profile-section-title">Saved Payment & Auto-Settlement</h3>
            <p className="profile-section-desc">Pre-authorized hospital payment rails for smooth patient escorts.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--cust-primary, #004349)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
          <span>Add New Method</span>
        </button>
      </div>

      {/* Zero Advance Deposit Policy Banner */}
      <div className="profile-policy-banner">
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--cust-primary)', flexShrink: 0 }}>
          handshake
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--cust-on-secondary-fixed, #041d31)' }}>
            {cmsPolicyTitle || 'Zero Advance Deposit Policy'}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--cust-on-secondary-container, #4f657b)', marginTop: '0.15rem' }}>
            {cmsPolicyDesc || 'All companion escorts operate on "Pay After Service Handshake". Charges are triggered only after patient reaches home safely.'}
          </span>
        </div>
      </div>

      {/* Add New UPI Method Form Modal / Inline */}
      {isAdding && (
        <form onSubmit={handleAddUpi} style={{ padding: '1rem', backgroundColor: 'var(--cust-surface-container-low)', borderRadius: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            className="profile-input"
            value={newUpiId}
            onChange={(e) => setNewUpiId(e.target.value)}
            placeholder="Enter UPI ID (e.g. user@okhdfcbank)..."
            required
            style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', height: '2.5rem' }}
          />
          <button type="submit" className="cust-btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', whiteSpace: 'nowrap' }}>
            Link UPI
          </button>
          <button type="button" className="profile-btn-outline" onClick={() => setIsAdding(false)} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
            Cancel
          </button>
        </form>
      )}

      {/* Payment Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {methods.map((method) => (
          <div key={method.id} className="profile-payment-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: '3rem',
                height: '2.5rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--cust-surface-container-lowest, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                color: 'var(--cust-secondary)',
                flexShrink: 0,
              }}>
                {method.type === 'card' ? (
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--cust-primary)' }}>credit_card</span>
                ) : (
                  'UPI'
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                    {method.title}
                  </span>
                  {method.isDefault && (
                    <span className="profile-pill-tag" style={{ backgroundColor: 'var(--cust-surface-tint)', color: '#ffffff' }}>
                      Primary Default
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)', fontFamily: 'monospace' }}>
                  {method.subtitle}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', alignSelf: 'flex-end' }}>
              {method.tag && (
                <span style={{ fontSize: '0.75rem', color: 'var(--cust-surface-tint)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
                  {method.tag}
                </span>
              )}
              {!method.isDefault && (
                <button
                  type="button"
                  className="profile-btn-outline"
                  onClick={() => makeDefault(method.id)}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                >
                  Make Default
                </button>
              )}
              <button
                type="button"
                onClick={() => removeMethod(method.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cust-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
                title="Delete Method"
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cust-error)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cust-secondary)')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invoicing & GST Details */}
      <div style={{ paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--cust-surface-container, #eceeed)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
            Invoicing & GSTIN (Optional Tax Deduction)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--cust-surface-tint)', fontWeight: 700 }}>
            Enabled for Tax Receipts
          </span>
        </div>

        <div className="profile-form-grid">
          <div className="profile-field-group">
            <span className="profile-field-hint">Registered GSTIN Number</span>
            <div className="profile-input-box" style={{ fontFamily: 'monospace' }}>
              <input
                type="text"
                className="profile-input"
                value={currentGstin}
                onChange={(e) => setCurrentGstin(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-field-group">
            <span className="profile-field-hint">Invoicing Entity Name</span>
            <div className="profile-input-box">
              <input
                type="text"
                className="profile-input"
                value={currentEntity}
                onChange={(e) => setCurrentEntity(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
