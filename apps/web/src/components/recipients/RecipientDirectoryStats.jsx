import React from 'react';
import { Link } from 'react-router-dom';

export function RecipientDirectoryStats({ recipients = [], upcomingVisit = null }) {
  const totalCount = recipients.length;

  // Summarize relationships for subtitle (e.g., "Mother, Father & Maternal Aunt")
  const relationshipsList = recipients
    .map((r) => r.relationship)
    .filter(Boolean);
  const uniqueRelationships = Array.from(new Set(relationshipsList));
  const relationshipsSubtitle = uniqueRelationships.length > 0
    ? uniqueRelationships.slice(0, 3).join(', ') + (uniqueRelationships.length > 3 ? '…' : '')
    : 'No recipients configured yet';

  // Count mobility requirements
  const mobilityCount = recipients.filter((r) => {
    try {
      const parsed = typeof r.notes === 'string' && r.notes.startsWith('{')
        ? JSON.parse(r.notes)
        : null;
      return parsed?.mobility?.length > 0;
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="rc-stats-grid">
      {/* Card 1: Registered Members */}
      <div className="rc-stat-card">
        <div className="rc-stat-top">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="rc-stat-eyebrow">Directory Overview</span>
            <div className="rc-stat-number">
              {totalCount > 0 ? `${totalCount} Active` : '0 Active'}
            </div>
            <span className="rc-stat-desc">{relationshipsSubtitle}</span>
          </div>
          <div className="rc-stat-icon-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>groups</span>
          </div>
        </div>

        <div className="rc-stat-bottom">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#004349', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: totalCount > 0 ? '#004349' : '#bfc8c9', display: 'inline-block' }} />
            {totalCount > 0 ? '100% ID Verified Profiles' : 'No verified profiles yet'}
          </span>
          <span style={{ color: '#4b6077' }}>
            {totalCount > 0 ? 'Bhimavaram Network' : 'Ready for setup'}
          </span>
        </div>
      </div>

      {/* Card 2: Next Hospital Visit */}
      <div className="rc-stat-card">
        <div className="rc-stat-top">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="rc-stat-eyebrow highlight">Immediate Schedule</span>
            <div className="rc-stat-number" style={{ fontSize: upcomingVisit ? '1.35rem' : '1.85rem' }}>
              {upcomingVisit ? upcomingVisit.displayTime : 'None Scheduled'}
            </div>
            <span className="rc-stat-desc" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
              {upcomingVisit ? `${upcomingVisit.recipientName} • ${upcomingVisit.hospitalName}` : 'No upcoming visits'}
            </span>
          </div>
          <div className="rc-stat-icon-wrap tertiary">
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>local_hospital</span>
          </div>
        </div>

        <div className="rc-stat-bottom">
          {upcomingVisit ? (
            <>
              <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#ffdbd2', color: '#8c3923', fontWeight: 600 }}>
                {upcomingVisit.statusText || 'Scheduled'}
              </span>
              <Link to={`/app/requests/${upcomingVisit.id}`} style={{ color: '#004349', fontWeight: 600, textDecoration: 'none' }}>
                Transit Track →
              </Link>
            </>
          ) : (
            <>
              <span style={{ color: '#4b6077' }}>All desks on standby</span>
              <Link to="/request-care" style={{ color: '#004349', fontWeight: 600, textDecoration: 'none' }}>
                Request Care →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Card 3: Mobility Protocols */}
      <div className="rc-stat-card">
        <div className="rc-stat-top">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="rc-stat-eyebrow">Mobility Protocols</span>
            <div className="rc-stat-number">
              {mobilityCount > 0 ? `${mobilityCount} Configured` : '0 Configured'}
            </div>
            <span className="rc-stat-desc">
              {mobilityCount > 0 ? 'Wheelchair & physical gait support flags' : 'No mobility protocols configured'}
            </span>
          </div>
          <div className="rc-stat-icon-wrap secondary">
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>accessible</span>
          </div>
        </div>

        <div className="rc-stat-bottom">
          <span>Stretcher / Van Adaptations</span>
          <span style={{ color: '#004349', fontWeight: 600 }}>
            {mobilityCount > 0 ? 'Pre-authorized' : 'Standard ambulatory'}
          </span>
        </div>
      </div>
    </div>
  );
}
