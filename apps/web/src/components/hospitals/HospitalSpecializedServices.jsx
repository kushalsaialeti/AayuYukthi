import React from 'react';
import { Icon } from '../public/Icon.jsx';

export function HospitalSpecializedServices({ hospital, services = [] }) {
  const customServices = Array.isArray(hospital?.specialized_services) && hospital.specialized_services.length > 0
    ? hospital.specialized_services
    : [];

  const displayName = hospital?.name_en || 'this Campus';

  if (customServices.length === 0 && services.length === 0) return null;

  return (
    <section className="hsp-detail-section hsp-specialized-services-card">
      <div className="hsp-section-title-wrap mb-space-sm">
        <div className="hsp-section-icon-badge">
          <Icon name="assignment_turned_in" size={20} />
        </div>
        <h2 className="hsp-section-title">Specialized Services at {displayName}</h2>
      </div>

      <p className="hsp-section-desc mb-space-md">
        Our coordinators are deeply familiar with this facility's specific administrative touchpoints, nursing stations, and payment workflows.
      </p>

      {customServices.length > 0 ? (
        <div className="hsp-services-grid">
          {customServices.map((srv, idx) => (
            <div
              key={idx}
              className={`hsp-service-card ${srv.full_width ? 'hsp-service-card-full' : ''}`}
            >
              <div className="hsp-service-card-header">
                <Icon name={srv.icon || 'verified'} size={24} className="text-primary" />
                <h3 className="hsp-service-title">{srv.title}</h3>
              </div>
              {srv.description && (
                <p className="hsp-service-desc">{srv.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Fallback to linked catalog services */
        <div className="hsp-services-grid">
          {services.map((srv) => (
            <div key={srv.id} className="hsp-service-card">
              <div className="hsp-service-card-header">
                <Icon name="check_circle" size={24} className="text-primary" />
                <h3 className="hsp-service-title">{srv.title_en}</h3>
              </div>
              {srv.summary_en && (
                <p className="hsp-service-desc">{srv.summary_en}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
