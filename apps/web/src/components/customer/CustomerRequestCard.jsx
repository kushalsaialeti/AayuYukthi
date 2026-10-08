import React from 'react';
import { Link } from 'react-router-dom';

export function CustomerRequestCard({ request, onDownloadPdf }) {
  const {
    id,
    service,
    hospital,
    recipient,
    coordinator,
    appointment_type,
    appointment_date,
    schedule_at,
    pickup_required,
    pickup_address,
    additional_requirements,
    status,
    completed_at,
    created_at,
    latest_summary,
  } = request;

  // Format reference ID: #SRV- + last 6 uppercase characters of UUID
  const refId = `#SRV-${(id || '').replace(/-/g, '').slice(-6).toUpperCase()}`;

  // Calculate age if date_of_birth exists
  const getAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return age > 0 ? `Age ${age}` : null;
  };

  const recipientAge = getAge(recipient?.date_of_birth);

  // Format schedule date and time
  const formatDateTime = (dateStr, scheduleStr) => {
    const target = scheduleStr ? new Date(scheduleStr) : (dateStr ? new Date(dateStr) : null);
    if (!target || isNaN(target.getTime())) return 'Scheduled Consultation';

    const now = new Date();
    const isToday = target.toDateString() === now.toDateString();
    const tomorrow = new Date(now.getTime() + 86400000);
    const isTomorrow = target.toDateString() === tomorrow.toDateString();

    const timeStr = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) return `Today • ${timeStr} IST`;
    if (isTomorrow) return `Tomorrow • ${timeStr} IST`;

    const dayName = target.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateFormatted = target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${dayName}, ${dateFormatted} • ${timeStr} IST`;
  };

  const scheduleDisplay = formatDateTime(appointment_date, schedule_at);

  // Status mapping
  const isConfirmed = status === 'CONFIRMED' || status === 'SCHEDULED' || status === 'SERVICE_IN_PROGRESS';
  const isMatching = status === 'COORDINATION_IN_PROGRESS' || status === 'UNDER_REVIEW' || status === 'REQUEST_RECEIVED';
  const isCompleted = status === 'COMPLETED';
  const isActionRequired = status === 'ACTION_REQUIRED';
  const isCancelled = status === 'CANCELLED';

  // Accent border class
  let accentClass = 'cust-accent-review';
  if (isConfirmed) accentClass = 'cust-accent-confirmed';
  else if (isMatching) accentClass = 'cust-accent-matching';
  else if (isCompleted) accentClass = 'cust-accent-completed';
  else if (isActionRequired) accentClass = 'cust-accent-review';

  // Extract initials
  const getInitials = (name) => {
    if (!name) return 'CR';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Parse directives chips
  const directives = [];
  if (pickup_required) {
    directives.push({ icon: 'directions_car', text: pickup_address ? `Pickup booked (${pickup_address.slice(0, 30)}...)` : 'Doorstep pickup booked' });
  }
  if (additional_requirements) {
    const pieces = additional_requirements.split(/[,•\n]/).map((s) => s.trim()).filter(Boolean);
    pieces.slice(0, 4).forEach((p) => {
      let icon = 'info';
      const lower = p.toLowerCase();
      if (lower.includes('wheelchair')) icon = 'accessible';
      else if (lower.includes('kannada') || lower.includes('hindi') || lower.includes('telugu') || lower.includes('fluent') || lower.includes('language')) icon = 'translate';
      else if (lower.includes('queue') || lower.includes('opd') || lower.includes('token') || lower.includes('consult')) icon = 'receipt_long';
      else if (lower.includes('walk') || lower.includes('elderly')) icon = 'elderly';
      else if (lower.includes('hearing')) icon = 'hearing';
      else if (lower.includes('mri') || lower.includes('lab') || lower.includes('fast-track')) icon = 'timer';
      directives.push({ icon, text: p });
    });
  }

  return (
    <div className={`cust-card ${accentClass}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Row: Ref ID, Status Badge, Service, Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--cust-primary)', letterSpacing: '0.02em' }}>
            {refId}
          </span>

          {/* Status Badge */}
          {isConfirmed && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: 'var(--cust-secondary-fixed)',
              color: 'var(--cust-on-secondary-fixed)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.2rem 0.625rem',
              borderRadius: '9999px',
              letterSpacing: '0.02em'
            }}>
              <span style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--cust-surface-tint)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
              CONFIRMED DISPATCH
            </span>
          )}

          {isMatching && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: 'var(--cust-secondary-container)',
              color: 'var(--cust-on-secondary-container)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.2rem 0.625rem',
              borderRadius: '9999px',
              letterSpacing: '0.02em'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: 'spin 2s linear infinite' }}>
                sync
              </span>
              COORDINATOR MATCHING
            </span>
          )}

          {isCompleted && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: 'var(--cust-surface-container)',
              color: 'var(--cust-on-surface-variant)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.2rem 0.625rem',
              borderRadius: '9999px',
              letterSpacing: '0.02em'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-surface-tint)' }}>
                check_circle
              </span>
              COMPLETED
            </span>
          )}

          {isActionRequired && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: '#ffdad6',
              color: '#93000a',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.2rem 0.625rem',
              borderRadius: '9999px',
              letterSpacing: '0.02em'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                warning
              </span>
              ACTION REQUIRED
            </span>
          )}

          {isCancelled && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: 'var(--cust-surface-container-high)',
              color: 'var(--cust-secondary)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.2rem 0.625rem',
              borderRadius: '9999px',
              letterSpacing: '0.02em'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                cancel
              </span>
              CANCELLED
            </span>
          )}

          <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
            • {service?.title || 'Hospital Visit Accompaniment'}
          </span>
        </div>


        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          color: 'var(--cust-on-surface-variant)',
          backgroundColor: 'var(--cust-surface-container-low)',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.5rem'
        }}>
          {isCompleted ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-surface-tint)' }}>
                verified_user
              </span>
              <span>Care Audit Logged</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--cust-primary)' }}>
                schedule
              </span>
              <span>Care Desk Active</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        alignItems: 'center'
      }}>
        {/* When & Who */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: isConfirmed ? 'var(--cust-primary)' : 'var(--cust-on-surface)',
            fontSize: '0.9375rem',
            fontWeight: 600
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isConfirmed ? 'var(--cust-primary)' : 'var(--cust-secondary)' }}>
              {isCompleted ? 'event_available' : (isConfirmed ? 'event_upcoming' : 'calendar_today')}
            </span>
            <span>{scheduleDisplay}</span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
            {appointment_type || 'Full hospital visit accompaniment & navigation'}
          </div>

          {/* Recipient info pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.35rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 67, 73, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cust-primary)',
              fontWeight: 700,
              fontSize: '0.75rem',
              flexShrink: 0
            }}>
              {getInitials(recipient?.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                {recipient?.name || 'Care Recipient'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                {recipient?.relationship ? recipient.relationship.charAt(0).toUpperCase() + recipient.relationship.slice(1) : 'Family Member'}
                {recipientAge ? ` • ${recipientAge}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Destination & Companion Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--cust-primary)', flexShrink: 0, marginTop: '2px' }}>
              location_on
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                {hospital?.name || 'Selected Medical Facility'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                {hospital?.city ? `${hospital.city} Campus` : 'Main Campus'} • OPD & Inpatient Coordination
              </span>
            </div>
          </div>

          {/* Companion Details */}
          {coordinator?.name ? (
            <div className="cust-companion-pill">
              <div style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '9999px',
                backgroundColor: 'var(--cust-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.6875rem',
                flexShrink: 0
              }}>
                {getInitials(coordinator.name)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                  {coordinator.name}
                </span>
                {coordinator.role && (
                  <span style={{
                    fontSize: '0.6875rem',
                    color: 'var(--cust-secondary)',
                    backgroundColor: 'var(--cust-surface-container)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '0.25rem'
                  }}>
                    {coordinator.role}
                  </span>
                )}
                {coordinator.rating && (
                  <span style={{
                    fontSize: '0.6875rem',
                    color: 'var(--cust-primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.15rem'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    {coordinator.rating}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="cust-companion-pill" style={{ color: 'var(--cust-on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-primary)' }}>
                person_search
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Assigning Dedicated Care Companion (Matching in progress)
              </span>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
          {isConfirmed && (
            <Link
              to={`/app/requests/${id}`}
              className="cust-btn-primary"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>near_me</span>
              <span>Track Live Milestones</span>
            </Link>
          )}

          {isCompleted ? (
            <>
              <Link
                to={`/app/requests/${id}`}
                className="cust-btn-secondary"
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>article</span>
                <span>View Visit Summary</span>
              </Link>
              <button
                type="button"
                onClick={() => onDownloadPdf?.(request)}
                className="cust-btn-secondary"
                style={{ width: '100%', boxSizing: 'border-box', color: 'var(--cust-primary)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
                <span>Download Notes (PDF)</span>
              </button>
            </>
          ) : (
            <Link
              to={`/app/requests/${id}`}
              className="cust-btn-secondary"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
              <span>View Details</span>
            </Link>
          )}
        </div>
      </div>

      {/* Directives Strip */}
      {directives.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'rgba(242, 244, 243, 0.7)',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.75rem'
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--cust-secondary)', textTransform: 'uppercase', marginRight: '0.25rem' }}>
            Directives:
          </span>
          {directives.map((d, idx) => (
            <span key={idx} className="cust-chip">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--cust-primary)' }}>
                {d.icon}
              </span>
              <span>{d.text}</span>
            </span>
          ))}
        </div>
      )}

      {/* Live Summary / Coordinator Message Strip */}
      {latest_summary ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: isCompleted ? 'rgba(220, 252, 231, 0.5)' : (isActionRequired ? 'rgba(254, 242, 242, 0.8)' : 'rgba(242, 244, 243, 0.8)'),
          border: `1px solid ${isCompleted ? '#bbf7d0' : (isActionRequired ? '#fecaca' : 'rgba(0,0,0,0.05)')}`,
          padding: '0.625rem 0.875rem',
          borderRadius: '0.75rem',
          fontSize: '0.8125rem'
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: '18px',
            color: isCompleted ? 'var(--cust-surface-tint)' : (isActionRequired ? 'var(--cust-error)' : 'var(--cust-primary)'),
            flexShrink: 0
          }}>
            {isCompleted ? 'check_circle' : (isActionRequired ? 'error' : 'chat_bubble')}
          </span>
          <span style={{ color: 'var(--cust-on-surface)' }}>
            <strong>{isCompleted ? 'Visit Dossier:' : (isActionRequired ? 'Action Needed:' : 'Latest Update:')}</strong> {latest_summary}
          </span>
        </div>
      ) : (isCompleted && completed_at ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(242, 244, 243, 0.7)',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.75rem',
          fontSize: '0.8125rem'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-surface-tint)', flexShrink: 0 }}>
            check
          </span>
          <span style={{ color: 'var(--cust-on-surface)' }}>
            <strong>Summary:</strong> Hospital journey completed safely • Prescriptions organized and post-visit dossier archived.
          </span>
        </div>
      ) : null)}
    </div>
  );
}

