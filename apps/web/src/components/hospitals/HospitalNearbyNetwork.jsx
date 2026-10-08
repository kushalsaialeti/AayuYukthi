import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../public/Icon.jsx';

export function HospitalNearbyNetwork({ currentHospital, nearbyList = [] }) {
  const filtered = (nearbyList || [])
    .filter((h) => h.id !== currentHospital?.id && h.slug !== currentHospital?.slug)
    .slice(0, 3);

  if (filtered.length === 0) return null;

  const cityName = currentHospital?.city || 'Regional';

  return (
    <div className="hsp-nearby-network-wrap">
      <div className="hsp-nearby-header-row">
        <div>
          <span className="hsp-nearby-eyebrow">{cityName} Hub Network</span>
          <h2 className="hsp-nearby-title">Other Supported Hospitals Nearby</h2>
        </div>

        <Link to="/hospitals" className="hsp-nearby-view-all">
          <span>View All Partner Hubs</span>
          <Icon name="chevron_right" size={18} />
        </Link>
      </div>

      <div className="hsp-nearby-grid">
        {filtered.map((h) => {
          const rating = h.rating || 4.8;
          const visits = h.assisted_visits_count || '1,800+ Assisted Visits';
          const area = h.city || cityName;
          const desc = h.description_en
            ? (h.description_en.length > 95 ? `${h.description_en.slice(0, 95)}…` : h.description_en)
            : (h.campus_highlight_en || 'Full outpatient guidance, senior escort, & fast-track lab collection.');

          return (
            <Link
              key={h.id}
              to={`/hospitals/${h.slug}`}
              className="hsp-nearby-card"
            >
              <div>
                <div className="hsp-nearby-card-top">
                  <span className="hsp-nearby-area-badge">{area}</span>
                  <span className="hsp-nearby-rating">
                    <Icon name="star" size={16} filled className="text-amber" />
                    <strong>{rating}</strong>
                  </span>
                </div>

                <h3 className="hsp-nearby-card-title">{h.name_en}</h3>
                <p className="hsp-nearby-card-desc">{desc}</p>
              </div>

              <div className="hsp-nearby-card-footer">
                <span>{visits}</span>
                <Icon name="arrow_forward" size={18} className="hsp-nearby-arrow" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
