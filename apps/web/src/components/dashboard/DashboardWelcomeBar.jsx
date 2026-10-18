import React from 'react';
import { Link } from 'react-router-dom';

export function DashboardWelcomeBar({
  user,
  activeCount = 0,
  nextHospitalName = '',
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name ? user.full_name.trim().split(' ')[0] : 'there';
  const greeting = `${getGreeting()}, ${firstName}`;

  const statusText = activeCount > 0
    ? `You have ${activeCount} active ${activeCount === 1 ? 'visit' : 'visits'} scheduled${nextHospitalName ? ` at ${nextHospitalName}` : ''}.`
    : 'All care desks are active. Schedule a visit whenever you need assistance.';

  return (
    <section className="dash-welcome-bar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h1 className="dash-welcome-title">{greeting}</h1>
        <p className="dash-welcome-sub">{statusText}</p>
      </div>

      <div className="dash-welcome-actions no-print">
        <Link to="/request-care" className="cust-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add_circle
          </span>
          <span>Request Care</span>
        </Link>
      </div>
    </section>
  );
}
