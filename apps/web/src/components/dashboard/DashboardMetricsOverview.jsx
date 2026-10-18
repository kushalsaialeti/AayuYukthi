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
      <Link to="/app/requests?tab=active" className="dash-metric-card" style={{ textDecoration: 'none' }}>
        <div className="dash-metric-header">
          <span>Active Visits</span>
          <div className="dash-metric-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              calendar_clock
            </span>
          </div>
        </div>
        <div>
          <span className="dash-metric-value">
            {activeCount}
          </span>
          <p className="dash-metric-sub">
            {nextHospitalName ? nextHospitalName : (activeCount > 0 ? 'Upcoming visits' : 'No upcoming visits')}
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
            {recipientsCount}
          </span>
          <p className="dash-metric-sub">
            {recipientsPreview || 'Add family members'}
          </p>
        </div>
      </Link>

      {/* Metric 3: Completed Visits */}
      <Link to="/app/requests?tab=completed" className="dash-metric-card" style={{ textDecoration: 'none' }}>
        <div className="dash-metric-header">
          <span>Completed</span>
          <div className="dash-metric-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              task_alt
            </span>
          </div>
        </div>
        <div>
          <span className="dash-metric-value">
            {completedCount}
          </span>
          <p className="dash-metric-sub">
            {completedCount > 0 ? 'Past visits' : 'No completed visits yet'}
          </p>
        </div>
      </Link>
    </section>
  );
}
