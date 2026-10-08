import React, { useState, useEffect } from 'react';

export function ProfilePersonalInfoForm({
  user,
  onSave,
  busy = false,
  status = null,
}) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [relationship, setRelationship] = useState(user?.preferences?.relationship || 'Son (Primary Kin)');
  const [metroHub, setMetroHub] = useState(user?.preferences?.metro_hub || 'Bengaluru, Karnataka');
  const [homeAddress, setHomeAddress] = useState(user?.preferences?.home_address || '#42, 6th Cross, 100Ft Road, Indiranagar, Bengaluru 560038');
  const [prefs, setPrefs] = useState({
    sms: user?.preferences?.sms ?? true,
    email: user?.preferences?.email ?? true,
    whatsapp: user?.preferences?.whatsapp ?? true,
  });

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      if (user.preferences) {
        if (user.preferences.relationship) setRelationship(user.preferences.relationship);
        if (user.preferences.metro_hub) setMetroHub(user.preferences.metro_hub);
        if (user.preferences.home_address) setHomeAddress(user.preferences.home_address);
        setPrefs({
          sms: user.preferences.sms ?? true,
          email: user.preferences.email ?? true,
          whatsapp: user.preferences.whatsapp ?? true,
        });
      }
    }
  }, [user]);

  const handleReset = () => {
    setFullName(user?.full_name || '');
    setRelationship(user?.preferences?.relationship || 'Son (Primary Kin)');
    setMetroHub(user?.preferences?.metro_hub || 'Bengaluru, Karnataka');
    setHomeAddress(user?.preferences?.home_address || '#42, 6th Cross, 100Ft Road, Indiranagar, Bengaluru 560038');
    setPrefs({
      sms: user?.preferences?.sms ?? true,
      email: user?.preferences?.email ?? true,
      whatsapp: user?.preferences?.whatsapp ?? true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      full_name: fullName.trim(),
      preferences: {
        ...(user?.preferences || {}),
        ...prefs,
        relationship,
        metro_hub: metroHub,
        home_address: homeAddress.trim(),
      },
    });
  };

  const togglePref = (k) => {
    setPrefs((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <div className="profile-section-card" id="section-personal">
      {/* Header */}
      <div className="profile-section-header">
        <div className="profile-section-title-group">
          <div className="profile-section-icon-box">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>person_pin</span>
          </div>
          <div>
            <h3 className="profile-section-title">Primary Caregiver Identity</h3>
            <p className="profile-section-desc">Verified identity on record with partner hospital networks.</p>
          </div>
        </div>

        <span className="profile-role-pill">
          Primary Account Owner
        </span>
      </div>

      {status === 'saved' && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          backgroundColor: '#e6f7f2',
          color: 'var(--cust-surface-tint, #20686f)',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          <span>Personal information and preferences updated successfully.</span>
        </div>
      )}

      {status && status !== 'saved' && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          backgroundColor: 'var(--cust-error-container, #ffdad6)',
          color: 'var(--cust-on-error-container, #93000a)',
          fontWeight: 600,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
          <span>{status}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="profile-form-grid">
          {/* Full Name */}
          <div className="profile-field-group">
            <label className="profile-field-label">Full Legal Name</label>
            <div className="profile-input-box">
              <input
                type="text"
                className="profile-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Anand Murthy"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="profile-field-group">
            <label className="profile-field-label">Email Address</label>
            <div className="profile-input-box">
              <input
                type="email"
                className="profile-input"
                value={user?.email || ''}
                readOnly
                disabled
                style={{ opacity: 0.85 }}
              />
              <span className="profile-verified-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                Verified
              </span>
            </div>
          </div>

          {/* Mobile Contact */}
          <div className="profile-field-group">
            <label className="profile-field-label">Mobile Contact (Hospital Handshake)</label>
            <div className="profile-input-box">
              <input
                type="tel"
                className="profile-input"
                value={user?.phone_e164 || '+91 98765 43210'}
                readOnly
                disabled
                style={{ opacity: 0.85 }}
              />
              <span className="profile-verified-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                OTP Verified
              </span>
            </div>
          </div>

          {/* Relationship */}
          <div className="profile-field-group">
            <label className="profile-field-label">Relationship to Primary Recipient</label>
            <div className="profile-input-box">
              <select
                className="profile-input"
                style={{ cursor: 'pointer' }}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                <option value="Son (Primary Kin)">Son (Primary Kin)</option>
                <option value="Daughter">Daughter</option>
                <option value="Spouse">Spouse</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Relative / Kin">Relative / Kin</option>
              </select>
            </div>
          </div>

          {/* Primary Metropolitan Hub */}
          <div className="profile-field-group">
            <label className="profile-field-label">Primary Metropolitan Hub</label>
            <div className="profile-input-box">
              <select
                className="profile-input"
                style={{ cursor: 'pointer' }}
                value={metroHub}
                onChange={(e) => setMetroHub(e.target.value)}
              >
                <option value="Bengaluru, Karnataka">Bengaluru, Karnataka</option>
                <option value="Hyderabad, Telangana">Hyderabad, Telangana</option>
                <option value="Bhimavaram, Andhra Pradesh">Bhimavaram, Andhra Pradesh</option>
                <option value="Vijayawada, Andhra Pradesh">Vijayawada, Andhra Pradesh</option>
                <option value="Chennai, Tamil Nadu">Chennai, Tamil Nadu</option>
              </select>
              <span className="profile-pill-tag" style={{ backgroundColor: 'var(--cust-primary-fixed, #abeef6)', color: 'var(--cust-on-primary-fixed, #002023)' }}>
                Active Metro
              </span>
            </div>
          </div>

          {/* Notification Channels */}
          <div className="profile-field-group">
            <label className="profile-field-label">Family Broadcast Channels</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', height: '3rem' }}>
              {[
                ['whatsapp', 'WhatsApp', 'chat'],
                ['sms', 'SMS', 'sms'],
                ['email', 'Email', 'mail'],
              ].map(([key, label, icon]) => (
                <label
                  key={key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: prefs[key] ? 'var(--cust-primary)' : 'var(--cust-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!prefs[key]}
                    onChange={() => togglePref(key)}
                    style={{ accentColor: 'var(--cust-primary-container, #0d5c63)' }}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Home Residence Address */}
          <div className="profile-field-group full-width">
            <label className="profile-field-label">Home Residence Address (Companion Transit Origin)</label>
            <div className="profile-textarea-box">
              <textarea
                className="profile-textarea"
                rows={2}
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Enter complete residence address for companion doorstep pickup..."
              />
            </div>
            <span className="profile-field-hint">
              Used by medical transit escorts for coordinated home pickup & dropoffs.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button
            type="button"
            className="profile-btn-outline"
            onClick={handleReset}
            disabled={busy}
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="cust-btn-primary"
            disabled={busy}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
            <span>{busy ? 'Saving Information…' : 'Save Personal Information'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
