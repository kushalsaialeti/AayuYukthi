import React from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '../../analytics.js';
import { Icon } from './Icon.jsx';

export function NeedSelector({
  eyebrow = 'Immediate Assistance',
  title = 'What do you need support with?',
  sub = 'Select your hospital visit requirement to begin personalized accompaniment coordination.',
  services = [],
}) {
  const navigate = useNavigate();

  const needs = [
    {
      id: 'hospital_visit',
      title: 'Hospital Visit',
      desc: 'Doctor consultation, OPD queues, and clinic navigation.',
      icon: 'local_hospital',
      category: 'outpatient',
    },
    {
      id: 'diagnostic_visit',
      title: 'Diagnostic Visit',
      desc: 'Blood tests, MRI, CT scans, and diagnostic lab escort.',
      icon: 'biotech',
      category: 'diagnostic',
    },
    {
      id: 'medicines_reports',
      title: 'Medicines / Reports',
      desc: 'Prescription pickup, pharmacy queue, and report collection.',
      icon: 'medication',
      category: 'pharmacy',
    },
    {
      id: 'pickup_drop',
      title: 'Pickup / Drop',
      desc: 'Doorstep sanitized cab transit and wheelchair boarding.',
      icon: 'directions_car',
      category: 'transit',
    },
    {
      id: 'other',
      title: 'Other Support',
      desc: 'Discharge coordination, bed admissions, or custom hospital care.',
      icon: 'volunteer_activism',
      category: 'custom',
    },
  ];

  const handleSelectNeed = (item) => {
    track('NEED_SELECTED', { need: item.id });
    
    // Find matching service from CMS services if available
    const matchedService = services.find((s) =>
      s.category?.toLowerCase() === item.category.toLowerCase() ||
      s.slug?.includes(item.id.replace('_', '-')) ||
      s.title_en?.toLowerCase().includes(item.title.toLowerCase())
    );

    const query = matchedService ? `?service_id=${matchedService.id}&need=${item.id}` : `?need=${item.id}`;
    navigate(`/request-care${query}`);
  };

  return (
    <section className="pub-section tint">
      <div className="pub-container">
        <div style={{ textAlign: 'center', maxWidth: '42rem', margin: '0 auto 2.5rem' }}>
          {eyebrow && <span className="pub-eyebrow">{eyebrow}</span>}
          <h2 className="pub-h2">{title}</h2>
          {sub && <p className="pub-sub">{sub}</p>}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {needs.map((n) => (
            <button
              key={n.id}
              type="button"
              className="pub-card"
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                border: '1px solid var(--pub-outline-variant, #e2e8f0)',
                background: 'var(--pub-surface, #ffffff)',
                padding: '20px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '160px',
              }}
              onClick={() => handleSelectNeed(n)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--pub-primary, #004349)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,67,73,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--pub-outline-variant, #e2e8f0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div
                  className="pub-icon-tile"
                  style={{
                    background: 'rgba(0, 67, 73, 0.08)',
                    color: 'var(--pub-primary, #004349)',
                    marginBottom: '12px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={n.icon} size={24} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px', color: 'var(--pub-on-surface, #0f172a)' }}>
                  {n.title}
                </h3>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--pub-on-surface-variant, #64748b)', lineHeight: 1.4 }}>
                  {n.desc}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--pub-primary, #004349)',
                }}
              >
                <span>Select & Request</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
