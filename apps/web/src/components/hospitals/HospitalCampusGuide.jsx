import React, { useState } from 'react';
import { Icon } from '../public/Icon.jsx';

export function HospitalCampusGuide({ hospital }) {
  const [showMapModal, setShowMapModal] = useState(false);

  const zones = Array.isArray(hospital?.zones) && hospital.zones.length > 0
    ? hospital.zones
    : [];

  const campusGuide = hospital?.campus_guide_en || hospital?.description_en || '';
  const campusSize = hospital?.campus_size_en || '';
  const mapImage = hospital?.map_image_url || hospital?.image_url;

  if (!campusGuide && zones.length === 0 && !mapImage) return null;

  return (
    <section className="hsp-detail-section hsp-campus-guide-card">
      <div className="hsp-section-header-row">
        <div className="hsp-section-title-wrap">
          <div className="hsp-section-icon-badge">
            <Icon name="domain" size={20} />
          </div>
          <h2 className="hsp-section-title">Campus Geography &amp; Zone Guide</h2>
        </div>
        {campusSize && (
          <span className="hsp-campus-size-tag">{campusSize}</span>
        )}
      </div>

      {campusGuide && (
        <p className="hsp-section-desc">{campusGuide}</p>
      )}

      {/* Zone Cards Grid */}
      {zones.length > 0 && (
        <div className="hsp-zones-grid">
          {zones.map((zone, idx) => (
            <div key={idx} className="hsp-zone-card">
              <div className="hsp-zone-card-top">
                <span className="hsp-zone-code">{zone.code || `Zone ${idx + 1}`}</span>
                <h3 className="hsp-zone-title">{zone.title || 'Campus Block'}</h3>
                {zone.description && (
                  <p className="hsp-zone-desc">{zone.description}</p>
                )}
              </div>
              {zone.location && (
                <div className="hsp-zone-location">
                  <Icon name={zone.icon || 'stairs'} size={16} />
                  <span>{zone.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Interactive Map Trigger Component */}
      {mapImage && (
        <div className="hsp-map-navigator-banner">
          <div
            className="hsp-map-thumb"
            style={{ backgroundImage: `url('${mapImage}')` }}
            onClick={() => setShowMapModal(true)}
            role="button"
            tabIndex={0}
            title="Click to zoom floor plan"
          />
          <div className="hsp-map-info">
            <h4 className="hsp-map-title">Interactive Campus Navigator</h4>
            <p className="hsp-map-desc">
              Need help orienting prior to arrival? Preview direct elevator corridors and parking bay entries.
            </p>
          </div>
          <button
            type="button"
            className="hsp-map-btn"
            onClick={() => setShowMapModal(true)}
          >
            <Icon name="explore" size={18} />
            <span>Open Floor Plan</span>
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {showMapModal && (
        <div className="hsp-modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="hsp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hsp-modal-header">
              <h3 className="hsp-modal-title">
                {hospital.name_en} — Campus &amp; Floor Plan
              </h3>
              <button
                type="button"
                className="hsp-modal-close"
                onClick={() => setShowMapModal(false)}
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="hsp-modal-body">
              <img
                src={mapImage}
                alt={`${hospital.name_en} floor plan`}
                className="hsp-modal-image"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
