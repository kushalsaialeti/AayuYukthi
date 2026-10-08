import React from 'react';

const AVATAR_PRESETS = {
  mother:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfRLw8wZeCoR2K6lDHD2BfmVRRyE8qIQT0dmdVEPuqL7PMeJxGJ64TvxyIEqMGgRSVl7EhCwsVMH5_WvZ-tarHfI5m_SsJ5EJSWUvlWVN3MSeX1sG_0zFqCtPW-jkTDaNBFu6QKmRSZ5NnOdnsgdRsODxtg1YwiTL2BN7IZLGzQzjGXs3lJzcKH0QeycEavjte56hirG2VyfsSbWbQc30TjsrGVQbhDoOUR5IUJeGjYgLGJDluoDI',
  father:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCPe40NxQDu2K-litFQ-_8cD-qSewa9-rVcXj4Uk_nqfuYCh-IBta6hd7yFKG1-9Z3tTQtZOu4u32tgC7WWIre_SYk_9uBcnXdiFfpj31620XenOiXy1oqume9RbG_NNPbV5pHuSbCCHRdDO7nOd9kGGs1C-xkYwZeBjsROwacSlgGCKHoFd41CNKIoW1sRww8NtOuuqO5IiLiAL1YquOPUtcFXWk4pIzAasz7ADM155mBYujsYS_0',
  female:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCT2i6W_sNdQjWSZlb1iuCtjCVTj54smsgi9Wgxe00F_UnKPStP_Z8FpVXo9u6ESm1buSarjJ_DUCJdQDfPhkD6z9iXLR3SGhaFjKaKyjvNf98P7OLfEXlHYlehHpQYHVGONc_R7WbqLRGOaAehWxETZg70sBQ2Cnu1k74tO5m_q8ut8k3lf0qMMXVCo_U5hxy43lVUGgnyKOag7not3WO3ycidZSsXsPSNhUZCGLQOdxtfs6x4Nho',
  default:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBRdZ_OEWj20PzUkMZllhj199BizAnpnZiD9lofcwX5eXaHDTzaTW0Ndrjfoefz1m5dqGiD9DtRZjq8YYyLcx8nDY9ZEnpb-_AkNI5WgXUrtUSdrzomnq_AT9ioeP6A-cUyru7gj32yDB_zh62QtHYBL4p4VGAWmRBac3NiuT2wjyp7_KAp4wXdkW6xZ2Iq-sB9alKx7_AWlhCw5mHTIPT8KvcH-ui6cJ4emQLxATK_XXjAOY8MkDo',
};

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

function getAvatarUrl(recipient) {
  if (recipient?.image_url) return recipient.image_url;
  const rel = (recipient?.relationship || '').toLowerCase();
  const gen = (recipient?.gender || '').toLowerCase();
  if (rel.includes('mother') || rel.includes('mom')) return AVATAR_PRESETS.mother;
  if (rel.includes('father') || rel.includes('dad')) return AVATAR_PRESETS.father;
  if (gen === 'female' || rel.includes('aunt') || rel.includes('wife')) return AVATAR_PRESETS.female;
  return AVATAR_PRESETS.default;
}

function getMobilityBadge(recipient) {
  const notes = (recipient?.medical_notes || recipient?.notes || recipient?.mobility || '').toLowerCase();
  const rel = (recipient?.relationship || '').toLowerCase();
  if (notes.includes('wheelchair') || notes.includes('wheel chair') || rel.includes('mother')) {
    return { label: 'Wheelchair Required', icon: 'accessible', isWheelchair: true };
  }
  if (notes.includes('walker') || notes.includes('slow') || rel.includes('father')) {
    return { label: 'Slow Walker / Assisted', icon: 'directions_walk', isWheelchair: false };
  }
  return { label: 'Independent Mobility', icon: 'nordic_walking', isWheelchair: false };
}

function getLanguages(recipient) {
  if (recipient?.preferred_languages?.length) {
    return recipient.preferred_languages.join(' / ');
  }
  return 'Telugu / English';
}

function getUHID(recipient) {
  if (recipient?.uhid) return recipient.uhid;
  const hash = (recipient?.id || '894120').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  return `#AY-${hash}`;
}

export function RecipientSelectionCard({
  recipient,
  isSelected,
  onSelect,
  isPrimary = false,
}) {
  const name = recipient.full_name || recipient.name || 'Care Recipient';
  const age = calculateAge(recipient.date_of_birth);
  const relation = recipient.relationship
    ? recipient.relationship.charAt(0).toUpperCase() + recipient.relationship.slice(1)
    : 'Family';
  const avatar = getAvatarUrl(recipient);
  const mobility = getMobilityBadge(recipient);
  const uhid = getUHID(recipient);
  const languages = getLanguages(recipient);

  const address = recipient.address_line1
    ? `${recipient.address_line1}, ${recipient.city || 'Bhimavaram'}`
    : (recipient.city ? `${recipient.city}, AP` : 'Bhimavaram Residence');

  const preferredHospital = recipient.preferred_hospital || 'Bhimavaram Partner Hospital';

  return (
    <label
      className={`rc-recipient-card ${isSelected ? 'is-selected' : ''}`}
      onClick={onSelect}
    >
      <input
        type="radio"
        name="care_recipient"
        value={recipient.id}
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />

      <div className="rc-card-top-row">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0, flex: 1 }}>
          {/* Avatar with role icon */}
          <div className="rc-card-avatar-wrapper">
            <img
              src={avatar}
              alt={name}
              className="rc-card-avatar-img"
            />
            <span className="rc-card-avatar-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                {age && age > 60 ? 'elderly' : 'person'}
              </span>
            </span>
          </div>

          {/* Details */}
          <div className="rc-card-main-content">
            <div className="rc-card-name-row">
              <h2 className="rc-card-name">{name}</h2>
              <span className="rc-card-relation-age">
                ({relation}{age ? `, ${age}y` : ''})
              </span>
              {isPrimary && (
                <span className="rc-card-status-pill">
                  Primary Recipient
                </span>
              )}
            </div>

            {/* Badges row: UHID, Mobility, Language */}
            <div className="rc-card-badges-row">
              <span className="rc-chip-micro">
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--cust-outline)' }}>
                  badge
                </span>
                UHID: {uhid}
              </span>

              <span className={`rc-chip-micro ${mobility.isWheelchair ? 'is-wheelchair' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  {mobility.icon}
                </span>
                {mobility.label}
              </span>

              <span className="rc-chip-micro">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  translate
                </span>
                {languages}
              </span>
            </div>

            {/* Logistics info: Address and preferred hospital */}
            <div className="rc-card-logistics-box">
              <div className="rc-logistics-item">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
                  home_pin
                </span>
                <span title={address}>{address}</span>
              </div>
              <div className="rc-logistics-item">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
                  local_hospital
                </span>
                <span title={preferredHospital}>{preferredHospital}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radio Check Circle Indicator */}
        <div className="rc-radio-indicator">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            check
          </span>
        </div>
      </div>
    </label>
  );
}
