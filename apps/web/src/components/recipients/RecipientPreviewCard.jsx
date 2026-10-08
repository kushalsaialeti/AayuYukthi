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

// Respectful portrait presets based on relationship / gender
const AVATAR_PRESETS = {
  mother: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRKqO6yW_1XvfzjoW-fe7HiETiVkxRkz3vf2Vz_UyKYgmNFScIHIFktmYV4ImWmwJ2CturS4qPT5pS00Oe-LHEtgPO2D1urHoZgIl2C4EbzLp-Xftr9rr58soVFNCGHwwTyZ5ts4XDnSXOGSfQ2ZNapmYYgPEboOlDrOf336s9iOqXf4ebqUYiZPW2HHhHCoo0R1qgeMc_sfKYmpKS-qnPKcM3ICNIRfFIRwQGlYKMivLyZUaYSe8',
  father: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvnlgvnxSkTutuNQtR3vVmKoUTF12qZglQXpaQxySjfCAaa7sedcTcwJRQqIn-5X-r2JVQCKt_SAo2gRfKSn7RfOhFkbYnObN9jE1z3U2AkF2GxT8bIUre-r-PIt2GYF8VRO50keZ2fYR1dRkj6TMWk9E-64cwUM76tubF0BTeAG9Nxd6N-PEv9EHtBUqWWQm3mkvtemTjsHSkPftOBHiFVybP2sEGH3WJ_ms8T275bc6l1D8lk4g',
  female: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiqqIFmNiXAWNFjnw9vaupT5yyikS7P6IttIlqfc8z92pULyZGxTmK7V8f8zkTXVOTRbOb-fnW-u-J_3UY1ZIfqlIifVxTLLVsGXAcJ2J6foyODjkdKZ1EwH3nqXU52ja6xwWz9e-CePkyZCHWnYz6ey9shgZ-DgFcTf7_wZZcTV0fGZkaaBJMADVjsLzdnTdZsuPQkZ8w2lSqDATmcjFT4HNbV7948MZdNqAPPudCAPrc7PHLpCM',
  default: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRdZ_OEWj20PzUkMZllhj199BizAnpnZiD9lofcwX5eXaHDTzaTW0Ndrjfoefz1m5dqGiD9DtRZjq8YYyLcx8nDY9ZEnpb-_AkNI5WgXUrtUSdrzomnq_AT9ioeP6A-cUyru7gj32yDB_zh62QtHYBL4p4VGAWmRBac3NiuT2wjyp7_KAp4wXdkW6xZ2Iq-sB9alKx7_AWlhCw5mHTIPT8KvcH-ui6cJ4emQLxATK_XXjAOY8MkDo',
};

function getAvatarUrl(values, config) {
  if (config?.profileImage && !values.relationship && !values.gender) {
    return config.profileImage;
  }
  const rel = (values.relationship || '').toLowerCase();
  const gender = (values.gender || '').toLowerCase();
  if (rel.includes('mother') || rel.includes('mom')) return AVATAR_PRESETS.mother;
  if (rel.includes('father') || rel.includes('dad')) return AVATAR_PRESETS.father;
  if (gender === 'female' || rel.includes('aunt') || rel.includes('sister') || rel.includes('wife')) return AVATAR_PRESETS.female;
  if (gender === 'male' || rel.includes('uncle') || rel.includes('brother') || rel.includes('husband')) return AVATAR_PRESETS.father;
  return config?.profileImage || AVATAR_PRESETS.default;
}

export function RecipientPreviewCard({ values, config }) {
  const hasName = Boolean(values.fullName?.trim());
  const previewName = hasName ? values.fullName.trim() : 'New Care Recipient';
  const previewRelation = values.relationship || 'Relationship pending';
  const previewAge = calculateAge(values.dob);
  const ageText = previewAge !== null ? `${previewAge} Years` : 'Age pending';

  const previewCity = values.cityMetro
    ? `${values.cityMetro}${values.pincode ? ` (${values.pincode})` : ''}`
    : 'Location pending';

  const isWheelchair = (values.mobility || []).includes('wheelchair');
  const languagesList = (values.languages || []).length > 0
    ? (values.languages || []).slice(0, 3).join(', ')
    : 'None selected';

  const hospitalName = values.hospital ? values.hospital.split(',')[0] : 'None selected';
  const profileImg = getAvatarUrl(values, config);

  const coordinatorImg = config?.coordinatorImage ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuATJxTS-CYEoz8i73ewIHt3iAiCVNEgCBRZFfVJGegy5Ezf2yZNand3rMKm-PS2Dy09HnFni_-uwuI23gefVkbdDw5N0qGTIgnRFheCEMbzqE06_ja6y1b3k27Lr9ZNv0MmLuYhdF8FxyBARaeof-guCuuZXmzj9JxUUGGNzdbTvwMicR_aeI6HTz2V5ML1rAB4VIK8BDrN7iZib6CEKMvjHIPnPvT7MrjXRjrCIzTqOAjbld5fFAY';

  const isProfileReady = hasName && values.dob && values.relationship;

  const nextSteps = config?.nextSteps || [
    { step: 1, title: 'Recipient Profile Saved', description: 'Safe credentials stored in your caregiver dashboard.' },
    { step: 2, title: '1-Click Booking Ready', description: 'Instantly dispatch a trained companion for future appointments.' },
    { step: 3, title: 'Live Transit Tracking', description: 'Follow gate entry, OPD room queues, and medicine dispatch.' },
  ];

  const guarantee = config?.guarantee || {
    title: 'AayuYukthi Companion Guarantee',
    description: 'Every companion is police-verified, CPR trained, and equipped with our digital hospital floor-plan GPS.',
  };

  return (
    <aside className="rf-aside-col">
      {/* Live Recipient Card Preview */}
      <div className="rf-preview-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--rf-text-secondary)', fontWeight: 700 }}>
            {config?.previewTitle || 'Profile Preview'}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: isProfileReady ? 'var(--rf-secondary-fixed)' : 'var(--rf-surface-container)',
            color: isProfileReady ? 'var(--rf-on-secondary-fixed)' : 'var(--rf-text-secondary)',
            padding: '0.15rem 0.6rem',
            borderRadius: '9999px',
            transition: 'all 0.2s',
          }}>
            {isProfileReady ? 'Ready to Link' : 'Draft Profile'}
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: 'rgba(242, 244, 243, 0.6)',
          borderRadius: '0.75rem'
        }}>
          <div className="rf-avatar-badge">
            <img
              src={profileImg}
              alt="Care recipient profile"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: hasName ? 'var(--rf-text)' : 'var(--rf-text-secondary)',
              fontStyle: hasName ? 'normal' : 'italic',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {previewName}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--rf-text-secondary)' }}>
              {previewRelation} • {ageText}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--rf-surface-tint)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
              {previewCity}
            </span>
          </div>
        </div>

        {/* Highlight Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--rf-text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>accessible</span> Wheelchair
            </span>
            <span style={{ fontWeight: 600, color: isWheelchair ? 'var(--rf-primary-container)' : 'var(--rf-text)' }}>
              {isWheelchair ? 'Requested' : 'Standard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--rf-text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>translate</span> Companion Dialect
            </span>
            <span style={{ fontWeight: 600, color: 'var(--rf-text)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={languagesList}>
              {languagesList}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--rf-text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_hospital</span> Primary Care
            </span>
            <span style={{ fontWeight: 600, color: 'var(--rf-text)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={values.hospital || 'Not selected'}>
              {hospitalName}
            </span>
          </div>
        </div>

        {/* Companion Guarantee */}
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', backgroundColor: 'rgba(242, 244, 243, 0.45)', borderRadius: '0.5rem', padding: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--rf-text)', fontSize: '12px', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--rf-surface-tint)' }}>
              shield
            </span>
            {guarantee.title}
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '12px', color: 'var(--rf-text-secondary)', lineHeight: 1.4 }}>
            {guarantee.description}
          </p>
        </div>
      </div>

      {/* What happens next? Module */}
      <div className="rf-next-steps-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--rf-primary)', fontSize: '24px' }}>
            partner_exchange
          </span>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--rf-text)' }}>
            What happens next?
          </h4>
        </div>

        <ol style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
          {nextSteps.map((step) => (
            <li key={step.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div className={`rf-step-num ${step.step === 1 ? '' : 'inactive'}`}>
                {step.step}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rf-text)' }}>
                  {step.title}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--rf-text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                  {step.description}
                </span>
              </div>
            </li>
          ))}
        </ol>

        {/* Companion Support Banner Image */}
        <div style={{ borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: '0.25rem' }}>
          <img
            src={coordinatorImg}
            alt="Care coordinator with patient"
            style={{ width: '100%', height: '8rem', objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>
    </aside>
  );
}
