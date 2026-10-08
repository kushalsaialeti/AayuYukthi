import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function HospitalDetailHeader({ hospital, tx }) {
  if (!hospital) return null;

  const scrollToBooking = (e) => {
    e.preventDefault();
    const el = document.getElementById('booking-widget');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const displayName = tx
    ? tx('hospitals', hospital.id, 'name_en', hospital.name_en)
    : hospital.name_en;

  const tagText = hospital.tag_en || null;
  const ratingVal = hospital.rating || null;
  const visitsVal = hospital.assisted_visits_count || null;
  const fullAddress = hospital.address_en || [hospital.city, hospital.state, hospital.pincode].filter(Boolean).join(', ');
  const phone = hospital.contact_phone || '180022982273';
  const disclaimer = hospital.disclaimer_en || `AayuYukthi is an independent companion and care coordination provider. We provide logistical, escort, and process advocacy for patients visiting ${displayName}; we do not provide medical treatment or represent hospital administration.`;

  return (
    <div className="hsp-detail-header-wrap">
      {/* 1. Breadcrumbs & Metadata Anchor */}
      <div className="hsp-detail-meta-bar">
        <nav className="hsp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="hsp-breadcrumb-link">
            <Icon name="home" size={16} />
            <span>Home</span>
          </Link>
          <span className="hsp-breadcrumb-sep">/</span>
          <Link to="/hospitals" className="hsp-breadcrumb-link">Hospitals</Link>
          <span className="hsp-breadcrumb-sep">/</span>
          <span className="hsp-breadcrumb-active">{displayName}</span>
        </nav>

        <div className="hsp-status-pulse-badge">
          <span className="hsp-pulse-dot" />
          <span>AayuYukthi On-Site Command Hub Active</span>
        </div>
      </div>

      {/* 2. Hospital Header & Verification Hero Card */}
      <div className="hsp-hero-card">
        <div className="hsp-hero-accent-strip" />
        <div className="hsp-hero-main-row">
          <div className="hsp-hero-info">
            <div className="hsp-hero-tags-row">
              {tagText && <span className="hsp-hero-tag-badge">{tagText}</span>}
              {ratingVal && (
                <span className="hsp-hero-rating-badge">
                  <Icon name="star" size={18} filled className="text-amber" />
                  <strong>{ratingVal}</strong>
                  {visitsVal && <span className="hsp-rating-sub">({visitsVal})</span>}
                </span>
              )}
              <span className="hsp-hero-verified-badge">
                <Icon name="verified" size={18} className="text-primary" />
                <span>Full Coordination Fleet</span>
              </span>
            </div>

            <h1 className="hsp-hero-title">{displayName}</h1>

            {fullAddress && (
              <p className="hsp-hero-address">
                <Icon name="location_on" size={20} className="text-secondary" />
                <span>{fullAddress}</span>
              </p>
            )}
          </div>

          <div className="hsp-hero-actions">
            <a href="#booking-widget" onClick={scrollToBooking} className="hsp-btn-hero-primary">
              <Icon name="calendar_add_on" size={20} />
              <span>Book Accompaniment</span>
            </a>
            <a href={`tel:${phone}`} className="hsp-btn-hero-icon" title="Quick Assistance Phone">
              <Icon name="call" size={20} className="text-primary" />
            </a>
          </div>
        </div>

        {/* Essential Distinction Banner (Humanist Notice) */}
        {disclaimer && (
          <div className="hsp-notice-box">
            <Icon name="shield_with_heart" size={22} className="text-secondary hsp-notice-icon" />
            <div className="hsp-notice-text">
              <strong className="hsp-notice-label">Non-Affiliated Coordination Notice: </strong>
              <span>{disclaimer}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
