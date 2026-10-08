import React from 'react';
import { Icon } from '../public/Icon.jsx';

export function HospitalMeetingPoints({ hospital }) {
  const points = Array.isArray(hospital?.meeting_points) && hospital.meeting_points.length > 0
    ? hospital.meeting_points
    : (hospital?.campus_highlight_en ? [
        {
          step: 1,
          title: 'Main Entrance & Coordination Drop-off',
          badge: 'Primary Pick-up',
          description: hospital.campus_highlight_en,
          landmark: hospital.wait_info_en || 'Main Hospital Porch',
        }
      ] : []);

  if (points.length === 0) return null;

  return (
    <section className="hsp-detail-section hsp-meeting-points-card">
      <div className="hsp-section-title-wrap mb-space-sm">
        <div className="hsp-section-icon-badge">
          <Icon name="meeting_room" size={20} />
        </div>
        <h2 className="hsp-section-title">Designated Coordination Meeting Points</h2>
      </div>

      <p className="hsp-section-desc mb-space-md">
        Your assigned companion arrives 15 minutes before your scheduled slot. Look for the official AayuYukthi badge, high-visibility credential tag, and navy coordination kit.
      </p>

      <div className="hsp-meeting-points-list">
        {points.map((pt, idx) => {
          const stepNum = pt.step || idx + 1;
          return (
            <div key={idx} className="hsp-meeting-point-item">
              <div className="hsp-step-bubble">{stepNum}</div>
              <div className="hsp-meeting-point-content">
                <div className="hsp-meeting-point-header">
                  <h3 className="hsp-meeting-point-title">{pt.title}</h3>
                  {pt.badge && (
                    <span className="hsp-point-badge">{pt.badge}</span>
                  )}
                </div>
                {pt.description && (
                  <p className="hsp-meeting-point-desc">{pt.description}</p>
                )}
                {pt.landmark && (
                  <div className="hsp-landmark-row">
                    <Icon name="near_me" size={18} />
                    <span>Landmark: {pt.landmark}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
