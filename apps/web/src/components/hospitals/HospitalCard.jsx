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
  const highlightBadge = campus_highlight_en || 'Coordination Active • 15m Lobby SLA';
  const waitInfoText = wait_info_en || getDefaultWaitInfo(slug, city);
  const serviceTags = features_en.length > 0 ? features_en : getDefaultFeatures(slug);

  return (
    <article className={`hsp-card ${viewMode === 'list' ? 'list-card' : ''}`}>
      {/* Visual Campus Photography Header */}
      <div className="hsp-card-visual">
        <HospitalImage hospital={hospital} alt={hospital.name_en} />
        <div className="hsp-card-gradient" />

        {/* Coordination SLA Badge */}
        <div className="hsp-card-badge">
          <span className="hsp-hero-pulse" style={{ width: 6, height: 6 }} />
          <span>{highlightBadge}</span>
        </div>

        {/* City / Locality Pin Overlay */}
        <div className="hsp-card-location-pin">
          <Icon name="location_on" size={16} />
          <span>{locationText}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="hsp-card-body">
        <div>
          <h2 className="hsp-card-title">{name}</h2>
          <p className="hsp-card-desc">{description}</p>
        </div>

        {/* Wait Time Telemetry Box */}
        <div className="hsp-telemetry-box">
          <Icon name="hail" size={17} className="text-primary" />
          <span>{waitInfoText}</span>
        </div>

        {/* Campus Service Badges */}
        <div className="hsp-service-tags">
          {serviceTags.map((tag, i) => (
            <span key={i} className="hsp-service-tag">
              {tag}
            </span>
          ))}
        </div>

        {/* Actions Row */}
        <div className="hsp-card-actions">
          <Link to={`/hospitals/${encodeURIComponent(slug)}`} className="hsp-btn-guide">
            <span>View Campus Guide</span>
            <Icon name="chevron_right" size={16} />
          </Link>
          <Link
            to={`/request-care?hospital=${encodeURIComponent(slug)}`}
            className="hsp-btn-request"
          >
            <Icon name="assignment_add" size={16} />
            <span>Request Care</span>
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
  return [city, state].filter(Boolean).join(', ') || 'Metro Campus';
}

function getDefaultWaitInfo(slug, city) {
  if (slug === 'apollo-health-city') return 'Avg Coordinator Wait: 0 mins (Dedicated Gate 2 Desk)';
  if (slug === 'manipal-hospital-old-airport-road') return 'Avg Coordinator Wait: 0 mins (Main Atrium Meetup)';
  if (slug === 'fortis-memorial-research-institute') return 'Avg Coordinator Wait: 0 mins (Tower A Lobby)';
  if (slug === 'max-super-speciality-saket') return 'Avg Coordinator Wait: 0 mins (East Block Reception)';
  if (slug === 'aster-cmi-hospital') return 'Avg Coordinator Wait: 0 mins (Ground Lobby Desk)';
  if (slug === 'narayana-health-city') return 'Avg Coordinator Wait: 0 mins (Mazumdar Shaw Concourse)';
  return `Avg Coordinator Wait: 0 mins (${city || 'Main'} Lobby Desk)`;
}

function getDefaultFeatures() {
  return ['Companion Escort', 'Wheelchair Logistics', 'OPD Navigation', 'Diagnostics Flow'];
}
