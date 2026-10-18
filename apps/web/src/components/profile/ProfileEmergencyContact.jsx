import React, { useState } from 'react';

export function ProfileEmergencyContact({
  contact = null,
  onUpdateContact,
}) {
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(contact?.name || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [relation, setRelation] = useState(contact?.relationship || '');

  const handleStartEdit = () => {
    setName(contact?.name || '');
    setPhone(contact?.phone || '');
    setRelation(contact?.relationship || '');
    setEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onUpdateContact) {
      onUpdateContact({
        name: name.trim(),
        phone: phone.trim(),
        relationship: relation.trim(),
      });
    }
    setEditing(false);
  };

  const handleRemove = () => {
    if (window.confirm('Remove this emergency contact?')) {
      if (onUpdateContact) {
        onUpdateContact(null);
      }
      setName('');
      setPhone('');
      setRelation('');
      setEditing(false);
    }
  };

  const getInitials = (n) => {
    if (!n) return 'EC';
    const p = n.trim().split(' ');
    if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const hasContact = Boolean(contact && contact.name);

  return (
    <div className="profile-section-card" id="section-emergency">
      {/* Header */}
      <div className="profile-section-header">
        <div className="profile-section-title-group">
          <div className="profile-section-icon-box tertiary">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>contact_emergency</span>
          </div>
          <div>
            <h3 className="profile-section-title">Emergency Contact</h3>
            <p className="profile-section-desc">Designated contact person if you are unreachable during a visit.</p>
          </div>
        </div>

        {hasContact && (
          <span className="profile-role-pill" style={{ backgroundColor: 'var(--cust-surface-container-high)', color: 'var(--cust-surface-tint)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--cust-surface-tint)', display: 'inline-block', marginRight: '4px' }} />
            Active Contact
          </span>
        )}
      </div>

      {/* Explanatory Reassurance Note */}
      <div className="profile-notice-box">
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-secondary)', flexShrink: 0, marginTop: '2px' }}>
          info
        </span>
        <p style={{ margin: 0 }}>
          This contact will be notified with real-time updates and reached out to if urgent decisions are required while escorting your care recipient.
        </p>
      </div>

      {/* Contact Display / Edit */}
      {!editing ? (
        hasContact ? (
          <div className="profile-contact-card">
            <div className="profile-contact-info">
              <div className="profile-contact-avatar">
                {getInitials(contact.name)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                  {contact.name}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--cust-secondary)' }}>
                  {contact.relationship ? `${contact.relationship} • ` : ''}{contact.phone}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end' }}>
              <button
                type="button"
                className="profile-btn-outline"
                onClick={handleStartEdit}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                <span>Edit</span>
              </button>
              <button
                type="button"
                className="profile-btn-outline"
                onClick={handleRemove}
                style={{ color: 'var(--cust-error, #ba1a1a)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem',
            backgroundColor: 'var(--cust-surface-container-low, #f2f4f3)',
            borderRadius: '0.75rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>No emergency contact listed</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>Add an alternate family member or friend for visit escalations.</p>
            </div>
            <button
              type="button"
              className="cust-btn-primary"
              onClick={handleStartEdit}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              <span>Add Emergency Contact</span>
            </button>
          </div>
        )
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="profile-form-grid">
            <div className="profile-field-group">
              <label className="profile-field-label">Contact Full Name</label>
              <div className="profile-input-box">
                <input
                  type="text"
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>
            </div>
            <div className="profile-field-group">
              <label className="profile-field-label">Mobile Phone Number</label>
              <div className="profile-input-box">
                <input
                  type="tel"
                  className="profile-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  required
                />
              </div>
            </div>
            <div className="profile-field-group full-width">
              <label className="profile-field-label">Relationship to You / Family</label>
              <div className="profile-input-box">
                <input
                  type="text"
                  className="profile-input"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="e.g. Sister, Brother, Neighbor, Family Doctor"
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
