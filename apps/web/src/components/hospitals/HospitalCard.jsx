import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';
import { HospitalImage } from '../public/HospitalWireframeImage.jsx';

export function HospitalCard({
  hospital,
  tx = (_, __, ___, fallback) => fallback,
  viewMode = 'grid',
}) {
  const {
    id,
    slug,
    city,
    state,
    address_en,
    logo_url,
    logo_media_id,
    campus_highlight_en,
    wait_info_en,
    features_en = [],
  } = hospital;

  const name = tx('hospitals', id, 'name_en', hospital.name_en);
  const description = tx('hospitals', id, 'description_en', hospital.description_en);

  const locationText = getLocationDisplay(address_en, city, state);
  // Only CMS-provided fields render — no invented SLA/wait-time telemetry.
  const highlightBadge = campus_highlight_en || null;
  const waitInfoText = wait_info_en || null;
  const serviceTags = features_en.length > 0 ? features_en : [];

  return (
    <article className={`hsp-card ${viewMode === 'list' ? 'list-card' : ''}`}>
      {/* Visual Campus Photography Header */}
      <div className="hsp-card-visual">
        <HospitalImage hospital={hospital} alt={hospital.name_en} />
        <div className="hsp-card-gradient" />

        {/* Coordination Badge (only when CMS provides one) */}
        {highlightBadge && (
          <div className="hsp-card-badge">
            <span className="hsp-hero-pulse" style={{ width: 6, height: 6 }} />
            <span>{highlightBadge}</span>
          </div>
        )}

        {/* City / Locality Pin Overlay */}
        {locationText && (
          <div className="hsp-card-location-pin">
            <Icon name="location_on" size={16} />
            <span>{locationText}</span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="hsp-card-body">
        <div>
          <h2 className="hsp-card-title">{name}</h2>
          <p className="hsp-card-desc">{description}</p>
        </div>

        {/* Wait Time Info (only when CMS provides it) */}
        {waitInfoText && (
          <div className="hsp-telemetry-box">
            <Icon name="hail" size={17} className="text-primary" />
            <span>{waitInfoText}</span>
          </div>
        )}

        {/* Campus Service Badges */}
        {serviceTags.length > 0 && (
          <div className="hsp-service-tags">
            {serviceTags.map((tag, i) => (
              <span key={i} className="hsp-service-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions Row */}
        <div className="hsp-card-actions">
          <Link to={`/hospitals/${encodeURIComponent(slug)}`} className="hsp-btn-guide">
            <span>View Campus Guide</span>
            <Icon name="chevron_right" size={16} />
          </Link>
          <Link
            to={`/request-care?hospital_id=${encodeURIComponent(id || slug)}`}
            className="hsp-btn-request"
          >
            <Icon name="calendar_month" size={16} />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function getLocationDisplay(address, city, state) {
  if (address) {
    const parts = address.split(',');
    if (parts.length > 1) {
      return `${parts[0].trim()}, ${city || state}`;
    }
  }
  return [city, state].filter(Boolean).join(', ') || null;
}
