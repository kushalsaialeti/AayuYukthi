import React, { useState } from 'react';
import { Icon } from '../public/Icon.jsx';

export function HospitalVisitChecklist({ hospital }) {
  const defaultChecklist = [
    'Hospital UHID / Registration Card — If you have visited previously, bring the UHID number to skip duplicate registration fees.',
    'Recent Medical Prescriptions & Diagnostics File — Historical ECGs, blood reports, and discharge summaries from the last 12 months.',
    'Government Photo ID & Insurance Physical Card — Aadhaar Card or PAN Card for the patient, alongside corporate/TPA health card.',
  ];

  const items = Array.isArray(hospital?.checklist_en) && hospital.checklist_en.length > 0
    ? hospital.checklist_en
    : defaultChecklist;

  const [checkedState, setCheckedState] = useState(() =>
    items.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );

  const toggleCheck = (idx) => {
    setCheckedState((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const displayName = hospital?.name_en || 'Hospital';

  return (
    <section className="hsp-detail-section hsp-checklist-card">
      <div className="hsp-section-title-wrap mb-space-sm">
        <div className="hsp-section-icon-badge">
          <Icon name="checklist_rtl" size={20} />
        </div>
        <h2 className="hsp-section-title">{displayName} Visit Preparation Checklist</h2>
      </div>

      <p className="hsp-section-desc mb-space-md">
        Having these documents ready prevents paperwork delays at primary hospital desks:
      </p>

      <div className="hsp-checklist-items">
        {items.map((item, idx) => {
          const parts = item.split('—');
          const title = parts[0]?.trim();
          const desc = parts.slice(1).join('—').trim();

          return (
            <label
              key={idx}
              className={`hsp-checklist-label ${checkedState[idx] ? 'is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={!!checkedState[idx]}
                onChange={() => toggleCheck(idx)}
                className="hsp-checkbox"
              />
              <div className="hsp-checklist-content">
                {desc ? (
                  <>
                    <strong className="hsp-checklist-title">{title}</strong> — <span>{desc}</span>
                  </>
                ) : (
                  <span>{item}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
