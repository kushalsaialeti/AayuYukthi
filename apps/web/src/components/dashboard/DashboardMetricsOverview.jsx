import React from 'react';
import { Link } from 'react-router-dom';

export function DashboardMetricsOverview({
  activeCount = 0,
  recipientsCount = 0,
  completedCount = 0,
  recipientsPreview = '',
  nextHospitalName = '',
}) {
  return (
    <section className="dash-metrics-grid">
      {/* Metric 1: Active Requests */}
      <Link to="/app/requests" className="dash-metric-card" style={{ textDecoration: 'none' }}>
        <div className="dash-metric-header">
          <span>Active Requests</span>
          <div className="dash-metric-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              calendar_clock
            </span>
          </div>
        </div>
        <div>
          <span className="dash-metric-value">
            {activeCount > 0 ? `${activeCount} Confirmed` : '0 Active'}
          </span>
          <p className="dash-metric-sub">
            {nextHospitalName ? `${nextHospitalName}` : 'No upcoming visits today'}
          </p>
        </div>
      </Link>

      {/* Metric 2: Care Recipients */}
      <Link to="/app/recipients" className="dash-metric-card" style={{ textDecoration: 'none' }}>
        <div className="dash-metric-header">
          <span>Care Recipients</span>
          <div className="dash-metric-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              group
            </span>
          </div>
        </div>
        <div>
          <span className="dash-metric-value">
            {recipientsCount > 0 ? `${recipientsCount} ${recipientsCount === 1 ? 'Profile' : 'Profiles'}` : '0 Profiles'}
          </span>
          <p className="dash-metric-sub">
            {recipientsPreview || '+ Add family members'}
          </p>
        </div>
      </Link>

      {/* Metric 3: Completed Journeys */}
      <Link to="/app/requests" className="dash-metric-card" style={{ textDecoration: 'none' }}>
        <div className="dash-metric-header">
          <span>Completed Journeys</span>
          <div className="dash-metric-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              task_alt
            </span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span className="dash-metric-value">
              {completedCount} Visits
            </span>
            {completedCount > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cust-primary)' }}>
                Completed
              </span>
            )}
          </div>
          <p className="dash-metric-sub">
            {completedCount > 0 ? 'Safe accompaniments fulfilled' : 'No past visits archived yet'}
          </p>
        </div>
      </Link>

      {/* Metric 4: Companion Desk */}
      <div className="dash-metric-card">
        <div className="dash-metric-header">
          <span>Companion Desk</span>
          <div
            className="dash-metric-icon"
            style={{ backgroundColor: 'var(--cust-secondary-fixed)', color: 'var(--cust-on-secondary-fixed)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              support_agent
            </span>
          </div>
        </div>
        <div>
          <span className="dash-metric-value">
            Dedicated Desk
          </span>
          <p className="dash-metric-sub">
            Bhimavaram Fleet Online
          </p>
        </div>
      </div>
    </section>
  );
}
