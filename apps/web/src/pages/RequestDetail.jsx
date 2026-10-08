import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { useDocumentMeta, Loading, LoadError } from '../components/layout.jsx';
import { EscortJourneyMilestones } from '../components/request-detail/EscortJourneyMilestones.jsx';
import { RequestDetailFaq } from '../components/request-detail/RequestDetailFaq.jsx';
import { CompanionCard } from '../components/request-detail/CompanionCard.jsx';
import { HospitalLiaisonDesk } from '../components/request-detail/HospitalLiaisonDesk.jsx';
import '../components/request-detail/request-detail.css';

function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Number.isNaN(age) || age < 0 ? null : age;
}

function extractBlockText(block, preferred = 'body_en', fallback = '') {
  if (!block) return fallback;
  if (typeof block === 'string') return block;
  if (typeof block === 'object') {
    return block[preferred] || block.body_en || block.title_en || block.body || block.title || fallback;
  }
  return String(block);
}

export function RequestDetail() {
  const { id } = useParams();
  const [req, setReq] = useState(null);
  const [cmsBlocks, setCmsBlocks] = useState({});
  const [helplinePhone, setHelplinePhone] = useState('1800-AAYU-CARE');
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDocumentMeta('Care Request Details', 'Live accompaniment tracking, hospital station liaison, and care dossier.');

  const fetchLiveDetails = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [reqData, blocksData, contactData] = await Promise.all([
        api.authedGetDetails(id),
        api.blocks([
          'request_detail.station.manager',
          'request_detail.station.location',
          'request_detail.station.intercom',
          'customer.emergency.helpline',
        ]).catch(() => ({})),
        api.contactInfo().catch(() => null),
      ]);

      setReq(reqData);
      setCmsBlocks(blocksData || {});

      if (contactData?.phone) {
        setHelplinePhone(contactData.phone);
      } else if (blocksData?.['customer.emergency.helpline']) {
        setHelplinePhone(extractBlockText(blocksData['customer.emergency.helpline'], 'body_en', '1800-AAYU-CARE'));
      }
      setError(null);
    } catch (err) {
      if (!silent) setError(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLiveDetails(false);

    // Auto-poll every 8 seconds to reflect CMS updates live immediately
    const pollInterval = setInterval(() => {
      fetchLiveDetails(true);
    }, 8000);

    // Also re-fetch immediately when family member returns to browser tab
    const handleFocus = () => {
      fetchLiveDetails(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchLiveDetails]);

  const cancel = async () => {
    if (!window.confirm('Are you sure you want to cancel and delete this care request? Your care companion and hospital desk will be notified immediately.')) return;
    setCancelling(true);
    try {
      const updated = await api.authedDeleteRequest(id);
      setReq((prev) => ({ ...prev, ...updated, status: updated.status }));
      track('REQUEST_CANCELLED', { requestId: id });
    } catch (e) {
      alert(e.message || 'Could not cancel request. Please contact Customer Care.');
      setError(e);
    } finally {
      setCancelling(false);
    }
  };

  if (error && !req) {
    return (
      <LoadError
        t={{ loadError: error.message ?? 'Could not load request details.', tryAgain: 'Try again' }}
        onRetry={() => fetchLiveDetails(false)}
      />
    );
  }

  if (!req) {
    return <Loading t={{ loading: 'Loading live request details and care status…' }} />;
  }

  const recipientAge = calculateAge(req.recipient?.date_of_birth);
  const recipientName = req.recipient?.name || 'Care Recipient';
  const recipientRel = req.recipient?.relationship || 'Family Member';
  const hospitalName = req.hospital?.name || 'Partner Hospital';
  const hospitalCity = req.hospital?.city || 'Bhimavaram';
  const serviceTitle = req.service?.title || 'Hospital Visit Accompaniment';
  const companionName = req.companion?.name || req.coordinator?.name || null;

  const refCode = `REF: ${hospitalCity.slice(0, 3).toUpperCase()}-${(req.id || '993821').slice(-4).toUpperCase()}`;
  const shortId = (req.id || '993821').slice(-6).toUpperCase();

  const cancellationPolicy = req.cancellation_policy || {
    allowed: ['REQUEST_RECEIVED', 'UNDER_REVIEW', 'ACTION_REQUIRED'].includes(req.status),
    requires_support: false,
    reason: null,
  };
  const cancellable = Boolean(cancellationPolicy.allowed);

  const formattedDate = req.schedule_at
    ? new Date(req.schedule_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : req.appointment_date
    ? new Date(req.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Pending Scheduling';

  const scheduledTimeStr = req.schedule_at
    ? new Date(req.schedule_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : (req.appointment_date ? 'Standard Slot' : 'Pending Scheduling');

  const stationManager = req.station?.manager || extractBlockText(cmsBlocks['request_detail.station.manager'], 'body_en', null);
  const stationLocation = req.station?.location || extractBlockText(cmsBlocks['request_detail.station.location'], 'body_en', null);
  const stationIntercom = req.station?.intercom || extractBlockText(cmsBlocks['request_detail.station.intercom'], 'body_en', null);
  const stationPhone = req.station?.phone || helplinePhone;

  return (
    <div className="rd-page-shell">
      <div className="rd-container">
        {/* 1. Breadcrumb & Status Super-Pill */}
        <div className="rd-top-bar">
          <nav aria-label="Breadcrumb" className="rd-breadcrumb">
            <Link to="/app/requests">Care Requests</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>chevron_right</span>
            <span style={{ color: 'var(--cust-on-surface)', fontWeight: 600 }}>Request #{shortId}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>chevron_right</span>
            <span style={{ color: 'var(--cust-tertiary)', fontWeight: 700 }}>Accompaniment Dossier</span>
          </nav>

          <div className="rd-super-pill-group">
            <div className={`rd-telemetry-pill ${req.status === 'CANCELLED' ? '' : 'is-active'}`}>
              <span className="rd-pulse-dot" />
              <span>{req.status ? req.status.replaceAll('_', ' ') : 'Live Accompaniment'}</span>
            </div>
            <span className="rd-ref-badge">{refCode}</span>
          </div>
        </div>

        {/* Cancellation Notice Banner (Locked / Requires Support / Cancelled) */}
        {req.status === 'CANCELLED' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--cust-surface-container-high)',
            color: 'var(--cust-on-surface)',
            fontSize: '0.875rem',
            border: '1px solid var(--cust-outline-variant)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--cust-error, #ba1a1a)' }}>
              cancel
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700 }}>This care request has been cancelled.</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--cust-secondary)' }}>
                No companion dispatch or billing is active for this reference.
              </span>
            </div>
          </div>
        ) : !cancellable && cancellationPolicy.requires_support ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.875rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: '0.84375rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: '260px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#d97706', flexShrink: 0 }}>
                lock_clock
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700 }}>Cancellation Window Locked</span>
                <span style={{ fontSize: '0.78125rem', color: '#78350f', lineHeight: 1.4 }}>
                  {cancellationPolicy.reason || 'Direct deletion is locked due to urgent dispatch timelines. Please contact customer care for immediate assistance.'}
                </span>
              </div>
            </div>

            <Link
              to={`/app/support?requestId=${req.id}&subject=${encodeURIComponent(`Urgent Cancellation for Request #${shortId}`)}`}
              className="cust-btn-secondary"
              style={{
                padding: '0.5rem 0.875rem',
                fontSize: '0.78125rem',
                backgroundColor: '#ffffff',
                color: '#b45309',
                borderColor: '#fcd34d',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>support_agent</span>
              <span>Contact Customer Care (#{shortId})</span>
            </Link>
          </div>
        ) : null}

        {/* 2. Main Title & Context Header */}
        <div className="rd-context-header">
          <div className="rd-context-left">
            <div className="rd-tag-row">
              <span className="rd-category-chip">{serviceTitle}</span>
              {req.appointment_type && (
                <>
                  <span style={{ color: 'var(--cust-secondary)' }}>•</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)', fontWeight: 600 }}>
                    {req.appointment_type}
                  </span>
                </>
              )}
            </div>

            <h1 className="rd-title">{serviceTitle}</h1>

            <p className="rd-subtitle">
              <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                {recipientName}
              </span>
              <span>({recipientAge ? `${recipientAge}y, ` : ''}{recipientRel})</span>
              <span style={{ color: 'var(--cust-outline-variant)' }}>|</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-primary)' }}>
                local_hospital
              </span>
              <span>{hospitalName}, {hospitalCity}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Live Refresh Button */}
            <button
              type="button"
              className="cust-btn-secondary"
              onClick={() => fetchLiveDetails(false)}
              disabled={isRefreshing}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.8125rem' }}
              title="Refresh live data from operations desk"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '18px',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              >
                sync
              </span>
              <span>{isRefreshing ? 'Refreshing…' : 'Sync Live'}</span>
            </button>

            {/* Scheduled Slot Timing Card */}
            <div className="rd-timing-card">
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-secondary)' }}>
                schedule
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', lineHeight: 1.25 }}>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--cust-secondary)', fontWeight: 600 }}>
                  {req.status === 'SERVICE_IN_PROGRESS' ? 'Service Began' : 'Scheduled Slot'}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                  {req.schedule_at ? `${scheduledTimeStr} IST (${formattedDate})` : formattedDate}
                </span>
              </div>
            </div>

            {cancellable && (
              <button
                type="button"
                onClick={cancel}
                disabled={cancelling}
                className="cust-btn-secondary"
                style={{
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.8125rem',
                  color: 'var(--cust-error, #ba1a1a)',
                  borderColor: 'rgba(186, 26, 26, 0.2)',
                }}
                title="Cancel / Delete request"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                <span>{cancelling ? 'Cancelling…' : 'Cancel / Delete Request'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Main Two-Column Layout Grid */}
        <div className="rd-main-grid">
          {/* Left Column (8 cols): Journey Milestones, Care Dossier, FAQs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
            {/* Live Journey Stepper Milestones */}
            <EscortJourneyMilestones
              request={req}
              doctorName={req.doctor_name || null}
              roomName={req.room_number || null}
            />

            {/* Post-Consultation Clinical Care Dossier (Recorded by Ops Desk in CMS) */}
            {req.visit_summary && (
              <section className="rd-card" style={{ borderLeft: '4px solid var(--cust-primary)' }}>
                <div className="rd-card-header">
                  <div className="rd-card-title-group">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--cust-primary)' }}>
                      clinical_notes
                    </span>
                    <h2 className="rd-card-title">Consultation &amp; Care Dossier</h2>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--cust-primary)',
                    backgroundColor: 'rgba(0, 106, 106, 0.1)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                  }}>
                    Published by Operations Desk
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--cust-on-surface)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {req.visit_summary}
                </div>
              </section>
            )}

            {/* Remote Family Member Clarification FAQs */}
            <RequestDetailFaq
              companionName={companionName}
              recipientName={recipientName}
              stationManager={stationManager}
            />
          </div>

          {/* Right Column (4 cols): Companion Card, Liaison Desk, Directives */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
            {/* Companion Profile Card (Live details from CMS) */}
            <CompanionCard
              name={companionName}
              role={req.companion?.role || 'Certified Care Companion'}
              companionId={req.companion?.badge_id || (req.assigned_to ? `AY-BHM-${String(req.assigned_to).slice(-4).toUpperCase()}` : null)}
              escortsCount={req.companion?.escorts_count || 'Verified Escort'}
              phone={req.companion?.phone || helplinePhone}
              isAssigned={Boolean(companionName)}
            />

            {/* Hospital Liaison Care Desk (Live details from CMS) */}
            <HospitalLiaisonDesk
              hospitalName={hospitalName}
              stationManager={stationManager}
              location={stationLocation}
              extension={stationIntercom}
              phone={stationPhone}
            />

            {/* Live Doorstep Transit Information (if pickup required) */}
            {req.pickup_required && (
              <div className="rd-card" style={{ gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-primary)' }}>
                    directions_car
                  </span>
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                    Doorstep Transit Coordination
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
                  {req.pickup_address || 'Residence doorstep pickup arranged with sanitized AC vehicle.'}
                </p>
              </div>
            )}

            {/* Custom Patient Mobility & Medical Directives */}
            {req.additional_requirements && (
              <div className="rd-card" style={{ gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-primary)' }}>
                    medical_services
                  </span>
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>
                    Mobility Directives &amp; Notes
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.5 }}>
                  {req.additional_requirements}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
