import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveImage } from '../../media.jsx';
import { Icon } from './Icon.jsx';
import { HospitalImage } from './HospitalWireframeImage.jsx';

/**
 * ServicePictorialGraphic:
 * Generates a clean, branded pictorial scene for services when an uploaded image is not present.
 */
function ServicePictorialGraphic({ slug = '', icon = 'medical_services', title = '' }) {
  const gradients = {
    'appointment-coordination': 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
    'hospital-visit-accompaniment': 'linear-gradient(135deg, #004349 0%, #006874 100%)',
    'pickup-drop': 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    'hospital-process-billing': 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
    'treatment-diagnostic-support': 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    'recurring-care-coordination': 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
  };

  const bg = gradients[slug] || 'linear-gradient(135deg, #004349 0%, #13e2bf 100%)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background geometric accents */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.15 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20%" cy="30%" r="60" fill="#ffffff" />
        <circle cx="85%" cy="80%" r="90" fill="#ffffff" />
        <line x1="0" y1="100" x2="300" y2="40" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 4" />
      </svg>

      {/* Central Pictorial Emblem */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          zIndex: 1,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '34px' }}>
          {icon || 'medical_services'}
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '12px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.95)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          zIndex: 1,
        }}
      >
        {title}
      </div>
    </div>
  );
}

// Themed service card: pictorial frame, title, compressed short description,
// subtitle (price/timing) + Book Service CTA & detail link.
export function ServiceCard({ service, t = {}, tx = (_e, _i, _f, s) => s }) {
  const [imgError, setImgError] = useState(false);

  const title = tx('services', service.id, 'title_en', service.title_en);
  const description = tx('services', service.id, 'description_en', service.description_en);
  const imageUrl = service.image_url;

  return (
    <article
      className="pub-card pub-service-pictorial-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '1rem',
        border: '1px solid rgba(0, 67, 73, 0.08)',
        boxShadow: '0 4px 16px -4px rgba(0, 67, 73, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Pictorial Header (Image or Branded Scene) */}
      <div style={{ height: '140px', position: 'relative', width: '100%', overflow: 'hidden' }}>
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={title}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : service.image_media_id && !imgError ? (
          <ResponsiveImage
            mediaId={service.image_media_id}
            fallbackSrc={service.fallbackImage}
            alt={title}
            widths={[400, 600]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <ServicePictorialGraphic slug={service.slug} icon={service.icon} title={title} />
        )}

        {service.category && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 46, 52, 0.85)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '3px 8px',
              borderRadius: '9999px',
              zIndex: 2,
            }}
          >
            {service.category}
          </span>
        )}
      </div>

      {/* Card Content Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.65rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--pub-on-surface, #002e34)' }}>
          {title}
        </h3>

        <p
          className="body"
          style={{
            margin: 0,
            fontSize: '13.5px',
            lineHeight: 1.5,
            color: 'var(--pub-on-variant, #4e6569)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>

        {service.subtitle_en && (
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--pub-primary, #004349)' }}>
            {service.subtitle_en}
          </div>
        )}

        {/* Action Row */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,67,73,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <Link
            to={`/request-care?service_id=${service.id}`}
            className="pub-btn pub-btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '12.5px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Book Service</span>
            <Icon name="arrow_forward" size={14} />
          </Link>

          <Link
            className="pub-link"
            to={`/services/${service.slug}`}
            style={{ fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
          >
            {t.learnMore || 'Details'} <Icon name="chevron_right" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ServicesGrid({ services, t = {}, tx, limit = 6 }) {
  const list = (services ?? []).slice(0, limit);
  if (!list.length) return <div className="pub-empty"><p>{t.emptyServices || 'No services currently listed.'}</p></div>;
  return (
    <div className="pub-grid-3">
      {list.map((s) => <ServiceCard key={s.id} service={s} t={t} tx={tx} />)}
    </div>
  );
}

// Themed hospital card: image banner (CMS media, live image, wireframe fallback),
// location, name, CMS description, and direct "Book Appointment" CTA button that auto-selects hospital.
export function HospitalCard({ hospital, t = {}, tx = (_e, _i, _f, s) => s, activeLabel = 'Coordination Active' }) {
  const name = tx('hospitals', hospital.id, 'name_en', hospital.name_en);
  const description = tx('hospitals', hospital.id, 'description_en', hospital.description_en);
  const locationText = [hospital.city, hospital.state].filter(Boolean).join(', ');

  return (
    <article className="pub-hosp-card">
      <div className="pub-hosp-img">
        <HospitalImage hospital={hospital} alt={hospital.name_en} />
        <span className="pub-hosp-badge">{activeLabel}</span>
      </div>
      <div className="pub-hosp-body">
        <div>
          {locationText && (
            <div className="pub-hosp-loc">
              <Icon name="location_on" size={16} />
              <span>{locationText}</span>
            </div>
          )}
          <h3>{name}</h3>
          {description && (
            <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {description}
            </p>
          )}
        </div>

        {/* Actions with Book Appointment button that pre-selects hospital in care request flow */}
        <div className="pub-hosp-foot" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            to={`/request-care?hospital_id=${encodeURIComponent(hospital.id)}`}
            className="pub-btn pub-btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.6rem 1rem', fontSize: '13px', borderRadius: '8px' }}
          >
            <Icon name="calendar_month" size={16} />
            <span>Book Appointment</span>
          </Link>

          <div style={{ textAlign: 'center' }}>
            <Link className="pub-link" to={`/hospitals/${hospital.slug}`} style={{ fontSize: '12.5px' }}>
              {t.viewDetails || 'View Campus Guide'} <Icon name="chevron_right" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HospitalsGrid({ hospitals, t = {}, tx, activeLabel, limit = 4 }) {
  const list = (hospitals ?? []).slice(0, limit);
  if (!list.length) return <div className="pub-empty"><p>{t.emptyHospitals || 'No partner hospitals available.'}</p></div>;
  return (
    <div className="pub-grid-4">
      {list.map((h) => <HospitalCard key={h.id} hospital={h} t={t} tx={tx} activeLabel={activeLabel} />)}
    </div>
  );
}
