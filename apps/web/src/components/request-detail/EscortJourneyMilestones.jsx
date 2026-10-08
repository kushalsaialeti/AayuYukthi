import React from 'react';

export function EscortJourneyMilestones({
  request,
  doctorName,
  roomName,
}) {
  const reqStatus = request?.status || 'REQUEST_RECEIVED';
  const pickupAddress = request?.pickup_address || 'Residence Doorstep';
  const hospitalName = request?.hospital?.name || 'Partner Hospital';
  const recipientName = request?.recipient?.name || 'Care Recipient';
  const companionName = request?.companion?.name || request?.coordinator?.name || 'Assigned Companion';
  const consultingDoctor = doctorName || request?.doctor_name || null;
  const clinicRoom = roomName || request?.room_number || null;

  // Determine current active step index based on status
  let currentStepIdx = 1;
  if (reqStatus === 'COMPLETED') currentStepIdx = 5;
  else if (reqStatus === 'SERVICE_IN_PROGRESS') currentStepIdx = 4;
  else if (reqStatus === 'SCHEDULED') currentStepIdx = 3;
  else if (reqStatus === 'CONFIRMED' || reqStatus === 'COORDINATION_IN_PROGRESS') currentStepIdx = 2;
  else currentStepIdx = 1;

  const slotTime = request?.schedule_at
    ? new Date(request.schedule_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : (request?.appointment_date ? 'Standard Slot' : 'Pending Scheduling');

  const steps = request?.milestones || [
    {
      id: 1,
      title: 'Home Pickup & Transit Rendezvous',
      time: request?.pickup_required ? 'At Doorstep Pickup' : 'At Hospital Arrival',
      description: request?.pickup_required
        ? `${pickupAddress}. Wheelchair assistance & sanitised transit ride.`
        : 'Direct hospital rendezvous meeting scheduled at main reception.',
    },
    {
      id: 2,
      title: 'Hospital Arrival & Valet Entry',
      time: slotTime,
      description: `${hospitalName} Main Reception. Direct companion rendezvous with ${companionName}.`,
    },
    {
      id: 3,
      title: 'Registration & Vitals Screening',
      time: 'OPD Intake',
      description: 'Pre-consultation vitals recording, queue token generation, and physical file compilation.',
    },
    {
      id: 4,
      title: 'In-Hospital Navigation & Doctor Consult',
      time: 'In Consultation',
      description: consultingDoctor && clinicRoom
        ? `${companionName} and ${recipientName} attended consultation in ${clinicRoom} with ${consultingDoctor}.`
        : consultingDoctor
        ? `${companionName} and ${recipientName} consultation scheduled with ${consultingDoctor}.`
        : `${companionName} and ${recipientName} in-hospital consultation with attending physician.`,
      doctor: consultingDoctor,
      room: clinicRoom,
    },
    {
      id: 5,
      title: 'Pharmacy Pickup & Care Dossier Handover',
      time: 'Conclusion',
      description: 'Prescription dispensation, pharmacy verification, and post-visit dossier archiving.',
    },
  ];

  const getActiveBadgeText = () => {
    if (reqStatus === 'COMPLETED') return 'Journey Successfully Completed';
    if (reqStatus === 'SERVICE_IN_PROGRESS') return clinicRoom ? `In Consultation • ${clinicRoom}` : 'In Consultation';
    if (reqStatus === 'SCHEDULED') return `Slot Confirmed for ${slotTime}`;
    if (reqStatus === 'CONFIRMED' || reqStatus === 'COORDINATION_IN_PROGRESS') return 'Care Companion Confirmed';
    return 'Intake Review in Progress';
  };

  return (
    <section className="rd-card">
      <div className="rd-card-header">
        <div className="rd-card-title-group">
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--cust-primary)' }}>
            route
          </span>
          <h2 className="rd-card-title">Escort Journey Milestones</h2>
        </div>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--cust-secondary)',
        }}>
          Step {Math.min(currentStepIdx, 5)} of 5 in progress
        </span>
      </div>

      {/* Vertical Timeline Steps */}
      <div className="rd-timeline-wrap">
        {steps.map((st) => {
          const isDone = st.id < currentStepIdx;
          const isActive = st.id === currentStepIdx;
          const isUpcoming = st.id > currentStepIdx;

          return (
            <div key={st.id} className="rd-timeline-step">
              {/* Node Badge */}
              <div className={`rd-node-badge ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''} ${isUpcoming ? 'is-upcoming' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontSize: isActive ? '16px' : '14px' }}>
                  {isDone ? 'check' : isActive ? (reqStatus === 'COMPLETED' ? 'check_circle' : 'schedule') : 'schedule'}
                </span>
              </div>

              {isActive ? (
                /* Active Stage Highlight Card */
                <div className="rd-step-card-active">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cust-tertiary)' }}>
                      {st.title}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '0.375rem',
                      backgroundColor: reqStatus === 'COMPLETED' ? '#dcfce7' : 'var(--cust-tertiary-fixed)',
                      color: reqStatus === 'COMPLETED' ? '#15803d' : 'var(--cust-on-tertiary-fixed-variant)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '9999px',
                        backgroundColor: reqStatus === 'COMPLETED' ? '#16a34a' : 'var(--cust-tertiary)'
                      }} />
                      <span>{getActiveBadgeText()}</span>
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cust-on-surface)', lineHeight: 1.6 }}>
                    {st.description}
                  </p>

                  {(st.room || st.doctor || clinicRoom || consultingDoctor) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
                      {(st.room || clinicRoom) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
                            pin_drop
                          </span>
                          <span>{st.room || clinicRoom}</span>
                        </span>
                      )}

                      {(st.doctor || consultingDoctor) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-primary)' }}>
                            person
                          </span>
                          <span>{st.doctor || consultingDoctor}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Completed or Upcoming Step Row */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', opacity: isUpcoming ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                      {st.title}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                      {st.time}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)' }}>
                    {st.description}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

