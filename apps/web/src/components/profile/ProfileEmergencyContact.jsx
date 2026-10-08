import React, { useState } from 'react';

export function ProfileEmergencyContact({
  contact = null,
  cmsNotice = '',
  onUpdateContact,
}) {
  const [editing, setEditing] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const defaultContact = {
    name: 'Sunita Murthy',
    relationship: 'Daughter / Sister',
    phone: '+91 98765 11223',
    permissions: ['Milestone Broadcast', 'Escort Directive Authorization'],
  };

  const activeContact = contact || defaultContact;
  const [name, setName] = useState(activeContact.name);
  const [phone, setPhone] = useState(activeContact.phone);
  const [relation, setRelation] = useState(activeContact.relationship);

  const handleTestAlert = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onUpdateContact) {
      onUpdateContact({
        name,
        phone,
        relationship: relation,
        permissions: activeContact.permissions,
      });
    }
    setEditing(false);
  };

  const getInitials = (n) => {
    if (!n) return 'EC';
    const p = n.trim().split(' ');
    if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className="profile-section-card" id="section-emergency">
      {/* Header */}
      <div className="profile-section-header">
        <div className="profile-section-title-group">
          <div className="profile-section-icon-box tertiary">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>contact_emergency</span>
          </div>
          <div>
            <h3 className="profile-section-title">Secondary & Emergency Escalation Contact</h3>
            <p className="profile-section-desc">Authorized to give consent during hospital escorts if primary is unreachable.</p>
          </div>
        </div>

        <span className="profile-role-pill" style={{ backgroundColor: 'var(--cust-surface-container-high)', color: 'var(--cust-surface-tint)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--cust-surface-tint)', display: 'inline-block', marginRight: '4px' }} />
          Active & Verified
        </span>
      </div>

      {/* Explanatory Reassurance Note */}
      <div className="profile-notice-box">
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-secondary)', flexShrink: 0, marginTop: '2px' }}>
          info
        </span>
        <p style={{ margin: 0 }}>
          {cmsNotice || 'This contact receives automated WhatsApp milestones, real-time GPS transit links, and can authorize emergency clinical escort directives if you cannot be reached within 15 minutes of doctor consultations.'}
        </p>
      </div>

      {alertSent && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          backgroundColor: '#e6f7f2',
          color: 'var(--cust-surface-tint)',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          <span>Simulated WhatsApp test broadcast transmitted to {activeContact.name} ({activeContact.phone}).</span>
        </div>
      )}

      {/* Secondary Contact Card Detail */}
      {!editing ? (
        <div className="profile-contact-card">
          <div className="profile-contact-info">
            <div className="profile-contact-avatar">
              {getInitials(activeContact.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                {activeContact.name}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--cust-secondary)' }}>
                {activeContact.relationship} • {activeContact.phone}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {activeContact.permissions?.map((perm, idx) => (
                  <span key={idx} className="profile-pill-tag">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end' }}>
            <button
              type="button"
              className="profile-btn-outline"
              onClick={handleTestAlert}
              title="Test WhatsApp Alert Broadcast"
              style={{ padding: '0.45rem 0.65rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>ring_volume</span>
              <span>Test Broadcast</span>
            </button>
            <button
              type="button"
              className="profile-btn-outline"
              onClick={() => setEditing(true)}
            >
              <span>Modify Details</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="profile-form-grid">
            <div className="profile-field-group">
              <label className="profile-field-label">Contact Name</label>
              <div className="profile-input-box">
                <input
                  type="text"
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="profile-field-group">
              <label className="profile-field-label">Mobile Phone (WhatsApp enabled)</label>
              <div className="profile-input-box">
                <input
                  type="tel"
                  className="profile-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="profile-field-group full-width">
              <label className="profile-field-label">Relationship & Authorization Scope</label>
              <div className="profile-input-box">
                <input
                  type="text"
                  className="profile-input"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="e.g. Daughter / Sister"
                  required
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="profile-btn-outline" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="cust-btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem' }}>
              Save Contact
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
