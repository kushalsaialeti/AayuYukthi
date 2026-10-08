import React from 'react';
import { Link } from 'react-router-dom';

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

const AVATAR_PRESETS = {
  mother:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD6sp8k8cmMPBfnukguURh_AJz3i-Jj4AofgyvjIq-150i_A3cmZEAYN-swTi7neusLr-UlQ90wYc4BwJ0OEroAntufio4sd00_thLCM5q3H7GhBBppmIpJgZ9QPGMAvBlSENCaKULBhlBjrj0y8Wql2WMu0I0xGpNpvWm22fERVLAGxpBz_H8tEj8Kni4Kxuuu5Rb23U-I_u38rfEBBIL-Kt0OLxIQPTy_R7_0iWXVsrKyk2DlIN8',
  father:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDvnlgvnxSkTutuNQtR3vVmKoUTF12qZglQXpaQxySjfCAaa7sedcTcwJRQqIn-5X-r2JVQCKt_SAo2gRfKSn7RfOhFkbYnObN9jE1z3U2AkF2GxT8bIUre-r-PIt2GYF8VRO50keZ2fYR1dRkj6TMWk9E-64cwUM76tubF0BTeAG9Nxd6N-PEv9EHtBUqWWQm3mkvtemTjsHSkPftOBHiFVybP2sEGH3WJ_ms8T275bc6l1D8lk4g',
  female:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDiqqIFmNiXAWNFjnw9vaupT5yyikS7P6IttIlqfc8z92pULyZGxTmK7V8f8zkTXVOTRbOb-fnW-u-J_3UY1ZIfqlIifVxTLLVsGXAcJ2J6foyODjkdKZ1EwH3nqXU52ja6xwWz9e-CePkyZCHWnYz6ey9shgZ-DgFcTf7_wZZcTV0fGZkaaBJMADVjsLzdnTdZsuPQkZ8w2lSqDATmcjFT4HNbV7948MZdNqAPPudCAPrc7PHLpCM',
  default:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBRdZ_OEWj20PzUkMZllhj199BizAnpnZiD9lofcwX5eXaHDTzaTW0Ndrjfoefz1m5dqGiD9DtRZjq8YYyLcx8nDY9ZEnpb-_AkNI5WgXUrtUSdrzomnq_AT9ioeP6A-cUyru7gj32yDB_zh62QtHYBL4p4VGAWmRBac3NiuT2wjyp7_KAp4wXdkW6xZ2Iq-sB9alKx7_AWlhCw5mHTIPT8KvcH-ui6cJ4emQLxATK_XXjAOY8MkDo',
};

function getAvatarUrl(recipient) {
  if (recipient?.image_url) return recipient.image_url;
  const rel = (recipient?.relationship || '').toLowerCase();
  const gen = (recipient?.gender || '').toLowerCase();
  if (rel.includes('mother') || rel.includes('mom')) return AVATAR_PRESETS.mother;
  if (rel.includes('father') || rel.includes('dad')) return AVATAR_PRESETS.father;
  if (gen === 'female' || rel.includes('wife')) return AVATAR_PRESETS.female;
  return AVATAR_PRESETS.default;
}

export function DashboardRecipientsWidget({ recipients = [] }) {
  return (
    <div className="cust-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
          Care Recipients at a Glance
        </h3>
        <Link
          to="/app/recipients/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--cust-primary)',
            textDecoration: 'none'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person_add</span>
          <span>+ Add Family Member</span>
        </Link>
      </div>

      {recipients.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--cust-secondary)', fontSize: '0.8125rem' }}>
          <span>No care recipients added yet. </span>
          <Link to="/app/recipients/new" style={{ color: 'var(--cust-primary)', fontWeight: 600 }}>
            Add your first family member
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recipients.slice(0, 4).map((rec) => {
            const age = calculateAge(rec.date_of_birth);
            const avatar = getAvatarUrl(rec);
            const relation = rec.relationship || 'Family';

            const displayName = rec.full_name || rec.name || 'Recipient';

            return (
              <Link
                key={rec.id}
                to="/app/recipients"
                className="dash-recipient-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={avatar}
                    alt={displayName}
                    style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', objectFit: 'cover' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                      {displayName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                      {relation}{age ? ` (${age}y)` : ''}
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--cust-surface-container-high)',
                  color: 'var(--cust-on-surface-variant)'
                }}>
                  Active
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
