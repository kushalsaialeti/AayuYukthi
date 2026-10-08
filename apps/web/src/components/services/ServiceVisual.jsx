import { ResponsiveImage } from '../../media.jsx';
import { Icon } from '../public/Icon.jsx';

export function ServiceVisual({ service, isFeatured = false }) {
  const { slug, image_url, image_media_id, category } = service;

  // 1. If uploaded media exists, use it
  if (image_url || image_media_id) {
    return (
      <div className="svc-visual-box">
        {image_media_id ? (
          <ResponsiveImage
            mediaId={image_media_id}
            fallbackSrc={image_url}
            alt={service.title_en || 'Service'}
          />
        ) : (
          <img src={image_url} alt={service.title_en || 'Service'} loading="lazy" />
        )}
        <div className={`svc-visual-tag ${isFeatured ? 'featured' : ''}`}>
          {isFeatured ? 'Most Requested' : getVisualBadgeText(slug, category)}
        </div>
      </div>
    );
  }

  // 2. Specialized SVG graphics for services without uploaded images
  if (slug === 'hospital-process-billing') {
    return (
      <div className="svc-visual-box" style={{ padding: '0.85rem', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--pub-on-variant)' }}>Discharge Speed Index</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pub-primary)' }}>65% Faster</span>
        </div>
        <svg viewBox="0 0 200 48" style={{ width: '100%', height: '3.5rem', color: 'var(--pub-primary)' }} fill="none">
          <path d="M5 40 L40 32 L85 24 L130 14 L175 6 L195 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="5" cy="40" r="3" fill="var(--pub-primary-container)" />
          <circle cx="85" cy="24" r="3" fill="var(--pub-primary-container)" />
          <circle cx="195" cy="4" r="4" fill="var(--pub-primary-container)" stroke="#ffffff" strokeWidth="2" />
          <text x="5" y="47" fontSize="7" fill="#6f797a">Pre-Auth</text>
          <text x="80" y="36" fontSize="7" fill="#6f797a">TPA Liaison</text>
          <text x="160" y="16" fontSize="7" fontWeight="bold" fill="var(--pub-primary)">Clearance</text>
        </svg>
        <span style={{ fontSize: '11px', color: 'var(--pub-on-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Direct TPA counter advocacy & audits
        </span>
      </div>
    );
  }

  if (slug === 'recurring-care-coordination') {
    return (
      <div className="svc-visual-box" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '3.5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 36 36" style={{ width: '3.5rem', height: '3.5rem', transform: 'rotate(-90deg)' }}>
              <path stroke="#e1e3e2" fill="none" strokeWidth="3.5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path stroke="var(--pub-tertiary)" fill="none" strokeWidth="3.5" strokeDasharray="100, 100" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <span style={{ position: 'absolute', fontSize: '11px', fontWeight: 700, color: 'var(--pub-on-surface)' }}>30d</span>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--pub-on-variant)', marginTop: '4px' }}>Continuous Care</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--pub-on-surface)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pub-tertiary)' }} /> Dedicated Mgr
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--pub-on-surface)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pub-primary)' }} /> Priority Slots
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--pub-on-surface)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pub-secondary)' }} /> Family Portal
          </div>
        </div>
      </div>
    );
  }

  // 3. Fallback illustration box with thematic color accents and icon
  const accent = getCategoryVisualAccent(category, slug);
  return (
    <div
      className="svc-visual-box"
      style={{
        background: `linear-gradient(135deg, ${accent.bgFrom} 0%, ${accent.bgTo} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent.iconColor,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Icon name={service.icon || accent.defaultIcon} size={28} />
      </div>
      <div className={`svc-visual-tag ${isFeatured ? 'featured' : ''}`}>
        {isFeatured ? 'Most Requested' : getVisualBadgeText(slug, category)}
      </div>
    </div>
  );
}

function getVisualBadgeText(slug, category) {
  if (slug === 'appointment-coordination') return 'OPD Fast-Track';
  if (slug === 'hospital-visit-accompaniment') return 'Most Requested';
  if (slug === 'pickup-drop') return 'Door-To-Door';
  if (slug === 'hospital-process-billing') return 'Fast Discharge';
  if (slug === 'treatment-diagnostic-support') return 'Bay-Side Care';
  if (slug === 'recurring-care-coordination') return 'Continuous Care';

  if (category === 'logistics') return 'Mobility & Transit';
  if (category === 'administrative') return 'Paperwork Support';
  if (category === 'recurring') return 'Monthly Plan';
  return 'Fast-Track';
}

function getCategoryVisualAccent(category, slug) {
  if (slug === 'hospital-visit-accompaniment' || category === 'recurring') {
    return {
      bgFrom: '#ffdbd2',
      bgTo: '#fcece9',
      iconColor: '#6d230f',
      defaultIcon: 'accessible_forward',
    };
  }
  if (category === 'logistics') {
    return {
      bgFrom: '#cee5ff',
      bgTo: '#edf4fd',
      iconColor: '#4b6077',
      defaultIcon: 'directions_car',
    };
  }
  return {
    bgFrom: '#abeef6',
    bgTo: '#ebfafd',
    iconColor: '#004349',
    defaultIcon: 'calendar_month',
  };
}
