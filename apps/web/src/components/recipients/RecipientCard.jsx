import React from 'react';
import { Link } from 'react-router-dom';
import { parseRecipientNotes } from './CareRecipientAddForm.jsx';

function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Number.isNaN(age) || age <= 0 ? null : age;
}

function formatDate(dobString) {
  if (!dobString) return '';
  try {
    const d = new Date(dobString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dobString;
  }
}

// Dignified portrait presets based on relationship / gender
const AVATAR_PRESETS = {
  mother: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRKqO6yW_1XvfzjoW-fe7HiETiVkxRkz3vf2Vz_UyKYgmNFScIHIFktmYV4ImWmwJ2CturS4qPT5pS00Oe-LHEtgPO2D1urHoZgIl2C4EbzLp-Xftr9rr58soVFNCGHwwTyZ5ts4XDnSXOGSfQ2ZNapmYYgPEboOlDrOf336s9iOqXf4ebqUYiZPW2HHhHCoo0R1qgeMc_sfKYmpKS-qnPKcM3ICNIRfFIRwQGlYKMivLyZUaYSe8',
  father: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvnlgvnxSkTutuNQtR3vVmKoUTF12qZglQXpaQxySjfCAaa7sedcTcwJRQqIn-5X-r2JVQCKt_SAo2gRfKSn7RfOhFkbYnObN9jE1z3U2AkF2GxT8bIUre-r-PIt2GYF8VRO50keZ2fYR1dRkj6TMWk9E-64cwUM76tubF0BTeAG9Nxd6N-PEv9EHtBUqWWQm3mkvtemTjsHSkPftOBHiFVybP2sEGH3WJ_ms8T275bc6l1D8lk4g',
  female: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiqqIFmNiXAWNFjnw9vaupT5yyikS7P6IttIlqfc8z92pULyZGxTmK7V8f8zkTXVOTRbOb-fnW-u-J_3UY1ZIfqlIifVxTLLVsGXAcJ2J6foyODjkdKZ1EwH3nqXU52ja6xwWz9e-CePkyZCHWnYz6ey9shgZ-DgFcTf7_wZZcTV0fGZkaaBJMADVjsLzdnTdZsuPQkZ8w2lSqDATmcjFT4HNbV7948MZdNqAPPudCAPrc7PHLpCM',
  default: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRdZ_OEWj20PzUkMZllhj199BizAnpnZiD9lofcwX5eXaHDTzaTW0Ndrjfoefz1m5dqGiD9DtRZjq8YYyLcx8nDY9ZEnpb-_AkNI5WgXUrtUSdrzomnq_AT9ioeP6A-cUyru7gj32yDB_zh62QtHYBL4p4VGAWmRBac3NiuT2wjyp7_KAp4wXdkW6xZ2Iq-sB9alKx7_AWlhCw5mHTIPT8KvcH-ui6cJ4emQLxATK_XXjAOY8MkDo',
};

function getAvatarUrl(recipient) {
  const rel = (recipient.relationship || '').toLowerCase();
  const gender = (recipient.gender || '').toLowerCase();
  if (rel.includes('mother') || rel.includes('mom')) return AVATAR_PRESETS.mother;
  if (rel.includes('father') || rel.includes('dad')) return AVATAR_PRESETS.father;
  if (gender === 'female' || rel.includes('aunt') || rel.includes('sister') || rel.includes('wife')) return AVATAR_PRESETS.female;
  if (gender === 'male' || rel.includes('uncle') || rel.includes('brother') || rel.includes('husband')) return AVATAR_PRESETS.father;
  return AVATAR_PRESETS.default;
}

export function RecipientCard({
  recipient,
  index = 0,
  upcomingVisit = null,
  currentUser = null,
  onEdit,
  onRemove,
  onRequestCare,
}) {
  const meta = parseRecipientNotes(recipient.notes);
  const age = calculateAge(recipient.date_of_birth);
  const formattedDob = formatDate(recipient.date_of_birth);
  const avatarUrl = getAvatarUrl(recipient);

  const isPrimary = index === 0;
  const accentClass = isPrimary ? '' : index % 2 === 1 ? 'secondary' : 'muted';
  const tagBadgeClass = isPrimary ? '' : 'secondary';

  // Mobility options
  const mobilityList = meta.mobility || [];
  const isWheelchair = mobilityList.includes('wheelchair');
  const isSlowWalker = mobilityList.includes('slow_walker');
  const isSensory = mobilityList.includes('sensory');
  const isIndependent = mobilityList.includes('independent');

  // Emergency contact
  const emergencyName = meta.isPrimaryContact !== false
    ? `${currentUser?.full_name || 'Primary Caregiver'} (Family Account)`
    : meta.secContact?.name
      ? `${meta.secContact.name} (${meta.secContact.relation || 'Contact'})`
      : `${currentUser?.full_name || 'Caregiver'}`;

  const emergencyPhone = meta.isPrimaryContact !== false
    ? (currentUser?.phone_e164 || '+91 98765 43210')
    : (meta.secContact?.phone || currentUser?.phone_e164 || '+91 98765 43210');

  // Spoken languages
  const languagesStr = (meta.languages || []).length > 0
    ? (meta.languages || []).join(', ')
    : 'Telugu, English';

  return (
    <article className="rc-card">
      <div className={`rc-accent-bar ${accentClass}`} />

      {/* Left Column: Avatar & Core Identity */}
      <div className="rc-col-identity">
        <div className="rc-avatar-box">
          <img
            src={avatarUrl}
            alt={recipient.full_name}
          />
          <span className={`rc-tag-badge ${tagBadgeClass}`}>
            {isPrimary ? 'Primary' : recipient.relationship || 'Recipient'}
          </span>
        </div>

        <div className="rc-identity-text">
          <h2 className="rc-name">{recipient.full_name}</h2>
          <p className="rc-meta-line" style={{ margin: '0.15rem 0' }}>
            {recipient.relationship} {age ? `• ${age} yrs` : ''}
            {formattedDob ? <span style={{ color: '#6f797a', fontSize: '12px', marginLeft: '4px' }}>({formattedDob})</span> : ''}
          </p>

          <div className="rc-icon-meta">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#004349' }}>
              location_on
            </span>
            <span>{meta.cityMetro || 'Bhimavaram'} {meta.pincode ? `(${meta.pincode})` : ''}</span>
          </div>

          <div className="rc-icon-meta">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4b6077' }}>
              domain
            </span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={meta.hospital || 'Hospital Network'}>
              {meta.hospital || 'Hospital Network Assigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Column: Care Attributes & Live Upcoming Visit */}
      <div className="rc-col-details">
        {/* Badges Strip */}
        <div className="rc-badge-strip">
          <span className="rc-pill primary">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
            {isPrimary ? 'Primary Recipient' : 'Active Profile'}
          </span>
          <span className="rc-pill secondary">
            Routine Care
          </span>
          <span className="rc-pill neutral">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#004349' }}>translate</span>
            {languagesStr}
          </span>
          {meta.uhid && (
            <span className="rc-pill neutral">
              UHID: {meta.uhid}
            </span>
          )}
        </div>

        {/* Highlight Box: Upcoming Visit OR Readiness Status */}
        {upcomingVisit ? (
          <div className="rc-visit-box">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', minWidth: 0 }}>
              <div className="rc-visit-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calendar_clock</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#6d230f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Next Scheduled Visit
                  </span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#6d230f' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#8c3923' }}>
                    {upcomingVisit.displayTime || 'Upcoming'}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 600, color: '#191c1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {upcomingVisit.serviceName || 'Consultation Accompaniment'} • {upcomingVisit.hospitalName || 'Hospital'}
                </p>
                <span style={{ fontSize: '12px', color: '#4b6077' }}>
                  Companion transit coordination active for pickup.
                </span>
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#ffffff', color: '#6d230f', fontSize: '11px', fontWeight: 700, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {upcomingVisit.statusText || 'Confirmed'}
              </span>
            </div>
          </div>
        ) : (
          <div className="rc-visit-box" style={{ backgroundColor: '#f2f4f3' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', minWidth: 0 }}>
              <div className="rc-visit-icon neutral">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>assignment_turned_in</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b6077', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Readiness Status
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 500, color: '#191c1c' }}>
                  Profile ready for 1-click booking • Coordinated with {meta.hospital ? meta.hospital.split(',')[0] : 'Preferred Hospital'}
                </p>
                <span style={{ fontSize: '12px', color: '#4b6077' }}>
                  No active hospital queue bookings pending. On standby.
                </span>
              </div>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <span style={{ color: '#4b6077', fontSize: '11px', fontWeight: 600 }}>On Standby</span>
            </div>
          </div>
        )}

        {/* Mobility & Emergency Contact Detailed Row */}
        <div className="rc-protocols-grid">
          {/* Mobility Protocols */}
          <div className="rc-protocol-cell">
            <span className="rc-protocol-title">Mobility &amp; Transit Protocol</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {isWheelchair && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#ffffff', padding: '3px 8px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', color: '#004349', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>accessible</span>
                  Wheelchair Required
                </span>
              )}
              {isSlowWalker && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#ffffff', padding: '3px 8px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', color: '#004349', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>elderly</span>
                  Slow Walker / Arm Support
                </span>
              )}
              {isIndependent && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#ffffff', padding: '3px 8px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', color: '#4b6077' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>directions_walk</span>
                  Independent Walker
                </span>
              )}
              {isSensory && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#ffffff', padding: '3px 8px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', color: '#4b6077' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>hearing</span>
                  Visual / Hearing Support
                </span>
              )}
              {!isWheelchair && !isSlowWalker && !isIndependent && !isSensory && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', backgroundColor: '#ffffff', padding: '3px 8px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', color: '#4b6077' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>directions_walk</span>
                  Standard Ambulatory Escort
                </span>
              )}
            </div>
          </div>

          {/* Emergency Escalation Contact */}
          <div className="rc-protocol-cell">
            <span className="rc-protocol-title">Primary Emergency Contact</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#191c1c' }}>
                  {emergencyName}
                </span>
                <span style={{ fontSize: '12px', color: '#4b6077' }}>
                  {emergencyPhone}
                </span>
              </div>
              <a
                href={`tel:${emergencyPhone}`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  backgroundColor: '#eceeed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#004349',
                  textDecoration: 'none',
                  transition: 'all 0.18s',
                }}
                title={`Call ${emergencyPhone}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Card Specific Action Center */}
      <div className="rc-col-actions">
        <button
          type="button"
          className="rc-btn-primary-action"
          onClick={() => onRequestCare(recipient.id)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_add_on</span>
          <span>Request Care</span>
        </button>

        <button
          type="button"
          className="rc-btn-sub-action"
          onClick={() => onEdit(recipient)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>badge</span>
          <span>Profile &amp; History</span>
        </button>

        <button
          type="button"
          className="rc-btn-sub-action rc-btn-danger-action"
          onClick={() => onRemove(recipient.id)}
          title="Remove care recipient"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
          <span>Remove</span>
        </button>
      </div>
    </article>
  );
}
