import React from 'react';
import { Icon } from '../public/Icon.jsx';

function getDepartmentIcon(dept) {
  const lower = dept.toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return 'cardiology';
  if (lower.includes('neuro') || lower.includes('stroke')) return 'neurology';
  if (lower.includes('ortho') || lower.includes('joint') || lower.includes('bone')) return 'orthopedics';
  if (lower.includes('onco') || lower.includes('cancer') || lower.includes('chemo')) return 'medical_services';
  if (lower.includes('nephro') || lower.includes('dialysis') || lower.includes('kidney')) return 'nephrology';
  if (lower.includes('geriatric') || lower.includes('elder')) return 'elderly';
  if (lower.includes('pediatric') || lower.includes('child')) return 'child_care';
  if (lower.includes('eye') || lower.includes('ophthal')) return 'visibility';
  if (lower.includes('ent') || lower.includes('ear')) return 'hearing';
  return 'local_hospital';
}

export function HospitalDepartments({ hospital }) {
  const departments = (Array.isArray(hospital?.departments_en) && hospital.departments_en.length > 0)
    ? hospital.departments_en
    : (Array.isArray(hospital?.features_en) && hospital.features_en.length > 0 ? hospital.features_en : []);

  if (departments.length === 0) return null;

  return (
    <section className="hsp-detail-section hsp-departments-card">
      <h2 className="hsp-section-title mb-1">Frequently Assisted Departments</h2>
      <p className="hsp-section-desc mb-space-md">
        Our companions specialize in the procedural workflows of these core hospital specialties:
      </p>

      <div className="hsp-departments-grid">
        {departments.map((dept, idx) => (
          <div key={idx} className="hsp-dept-chip">
            <Icon name={getDepartmentIcon(dept)} size={20} className="text-primary shrink-0" />
            <span className="hsp-dept-name">{dept}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
