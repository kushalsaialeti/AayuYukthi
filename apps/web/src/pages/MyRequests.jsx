import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useDocumentMeta, Loading, LoadError } from '../components/layout.jsx';
import { CustomerStatsCards } from '../components/customer/CustomerStatsCards.jsx';
import { CustomerRequestFilters } from '../components/customer/CustomerRequestFilters.jsx';
import { CustomerRequestCard } from '../components/customer/CustomerRequestCard.jsx';
import { CustomerAdvisoryBanner } from '../components/customer/CustomerAdvisoryBanner.jsx';
import '../components/customer/customer.css';

const CMS_KEYS = [
  'customer.requests.eyebrow',
  'customer.requests.title',
  'customer.requests.description',
  'customer.advisory.title',
  'customer.advisory.body',
  'customer.advisory.helpline',
  'customer.advisory.tel',
  'customer.metro.active',
  'customer.status.online',
  'customer.emergency.badge',
  'customer.emergency.helpline',
  'customer.emergency.desc',
];

const ACTIVE_STATUSES = new Set([
  'REQUEST_RECEIVED',
  'UNDER_REVIEW',
  'COORDINATION_IN_PROGRESS',
  'CONFIRMED',
  'SCHEDULED',
  'SERVICE_IN_PROGRESS',
]);

export function MyRequests() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useDocumentMeta('My Care Requests', 'Track upcoming hospital visits, monitor companion milestones, and view notes.');

  const [requests, setRequests] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [cmsBlocks, setCmsBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Filter States - Persisted across refreshes
  const [selectedTab, setSelectedTab] = useState(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab.toUpperCase();
    try {
      const cached = sessionStorage.getItem('ay_myrequests_tab');
      if (cached) return cached;
    } catch {}
    return 'ALL';
  });
  const [viewMode, setViewMode] = useState(() => {
    try {
      return sessionStorage.getItem('ay_myrequests_view') || 'list';
    } catch {
      return 'list';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
    try {
      sessionStorage.setItem('ay_myrequests_tab', tab);
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab.toLowerCase());
        return n;
      }, { replace: true });
    } catch {}
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      sessionStorage.setItem('ay_myrequests_view', mode);
    } catch {}
  };

  // Live fetch function - can be called silently in the background or with spinner
  const fetchLiveRequests = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [reqsData, draftsData, recsData, blocksData] = await Promise.all([
        api.authedList({ limit: 100 }).catch(() => ({ data: [] })),
        api.authedDraftsList().catch(() => ({ data: [] })),
        recipients.length === 0 ? api.recipients({ limit: 50 }).catch(() => ({ data: [] })) : Promise.resolve({ data: recipients }),
        Object.keys(cmsBlocks).length === 0 ? api.blocks(CMS_KEYS).catch(() => ({})) : Promise.resolve(cmsBlocks),
      ]);
      setRequests(reqsData?.data || []);
      setDrafts(draftsData?.data || draftsData || []);
      if (recsData?.data?.length && recipients.length === 0) setRecipients(recsData.data);
      if (blocksData && Object.keys(cmsBlocks).length === 0) setCmsBlocks(blocksData);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (!silent) setError(err);
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  };

  const handleActivateDraft = async (draftId) => {
    setActivatingId(draftId);
    setActionMessage(null);
    try {
      await api.authedDraftActivate(draftId);
      setActionMessage({ type: 'success', text: 'Success! Care request has been activated and submitted to hospital coordination.' });
      await fetchLiveRequests(false);
      handleTabChange('ACTIVE');
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Could not activate draft.' });
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    setActivatingId(draftId);
    setActionMessage(null);
    try {
      await api.authedDraftDelete(draftId);
      setActionMessage({ type: 'success', text: 'Draft deleted successfully.' });
      await fetchLiveRequests(false);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Could not delete draft.' });
    } finally {
      setActivatingId(null);
    }
  };

  const handleResumeDraft = (d) => {
    try {
      const p = d.payload || {};
      const normalizedDraft = {
        recipientId: p.recipient_id || p.recipientId || null,
        serviceId: p.service_id || p.serviceId || null,
        serviceIds: p.service_ids || (p.service_id ? [p.service_id] : []),
        hospitalId: p.hospital_id || p.hospitalId || null,
        appointmentType: p.appointment_type || p.appointmentType || '',
        additionalRequirements: p.additional_requirements || p.additionalRequirements || '',
        appointmentDate: p.appointment_date || p.appointmentDate || '',
        timeSlot: p.time_slot || p.timeSlot || 'Morning (08:00 AM – 12:00 PM)',
        scheduleAt: p.schedule_at || p.scheduleAt || null,
        pickupRequired: p.pickup_required ?? p.pickupRequired ?? false,
        pickupAddress: p.pickup_address || p.pickupAddress || '',
        dropoffAddress: p.dropoff_address || p.dropoffAddress || '',
        updatePhone: p.update_phone || p.updatePhone || '',
        consentAccepted: p.consent_accepted ?? p.consentAccepted ?? false,
      };
      sessionStorage.setItem('ay_guided_draft_v2', JSON.stringify(normalizedDraft));
      const targetStep = Math.min(Math.max(Number(d.current_step) || 1, 1), 7);
      sessionStorage.setItem('ay_guided_draft_v2_step', String(targetStep));
      if (d.idempotency_key) {
        sessionStorage.setItem('ay_guided_draft_idempotency_key', d.idempotency_key);
      }
      navigate('/request-care');
    } catch (err) {
      console.error('Failed to resume draft:', err);
    }
  };

  // Initial load + background live sync
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchLiveRequests(false);

    // Live background polling every 15 seconds to receive CMS & coordinator updates
    const pollInterval = setInterval(() => {
      if (mounted && document.visibilityState === 'visible') {
        fetchLiveRequests(true);
      }
    }, 15000);

    const handleFocus = () => {
      if (mounted) fetchLiveRequests(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Compute counts
  const counts = useMemo(() => {
    const list = requests || [];
    return {
      all: list.length,
      active: list.filter((r) => ACTIVE_STATUSES.has(r.status)).length,
      drafts: (drafts || []).length,
      completed: list.filter((r) => r.status === 'COMPLETED').length,
      review: list.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'REQUEST_RECEIVED').length,
    };
  }, [requests, drafts]);

  // Extract unique hospital names from customer's requests
  const uniqueHospitals = useMemo(() => {
    const list = requests || [];
    const set = new Set();
    list.forEach((r) => {
      if (r.hospital?.name) set.add(r.hospital.name);
    });
    return Array.from(set);
  }, [requests]);

  // Filter logic
  const filteredRequests = useMemo(() => {
    let list = requests || [];

    // Tab filter
    if (selectedTab === 'ACTIVE') {
      list = list.filter((r) => ACTIVE_STATUSES.has(r.status));
    } else if (selectedTab === 'COMPLETED') {
      list = list.filter((r) => r.status === 'COMPLETED');
    } else if (selectedTab === 'REVIEW') {
      list = list.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'REQUEST_RECEIVED');
    }

    // Recipient filter
    if (selectedRecipient) {
      list = list.filter((r) => r.recipient?.name === selectedRecipient);
    }

    // Hospital filter
    if (selectedHospital) {
      list = list.filter((r) => r.hospital?.name === selectedHospital);
    }

    // Period filter
    if (selectedPeriod === '30D') {
      const past30 = Date.now() - 30 * 86400000;
      list = list.filter((r) => new Date(r.created_at).getTime() >= past30);
    } else if (selectedPeriod === '6M') {
      const past6M = Date.now() - 180 * 86400000;
      list = list.filter((r) => new Date(r.created_at).getTime() >= past6M);
    } else if (selectedPeriod === '2024') {
      list = list.filter((r) => new Date(r.created_at).getFullYear() === 2024);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const refId = `#SRV-${(r.id || '').replace(/-/g, '').slice(-6).toUpperCase()}`.toLowerCase();
        const hospName = (r.hospital?.name || '').toLowerCase();
        const recName = (r.recipient?.name || '').toLowerCase();
        const coordName = (r.coordinator?.name || '').toLowerCase();
        const servTitle = (r.service?.title || '').toLowerCase();
        return (
          refId.includes(q) ||
          hospName.includes(q) ||
          recName.includes(q) ||
          coordName.includes(q) ||
          servTitle.includes(q)
        );
      });
    }

    return list;
  }, [requests, selectedTab, selectedRecipient, selectedHospital, selectedPeriod, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Export CSV handler
  const handleExportCsv = () => {
    if (!filteredRequests.length) return;
    const headers = ['Ref ID', 'Recipient', 'Service', 'Hospital', 'Schedule Date', 'Status', 'Coordinator', 'Summary'];
    const rows = filteredRequests.map((r) => [
      `#SRV-${(r.id || '').replace(/-/g, '').slice(-6).toUpperCase()}`,
      `"${r.recipient?.name || ''}"`,
      `"${r.service?.title || ''}"`,
      `"${r.hospital?.name || ''}"`,
      r.appointment_date || r.schedule_at || '',
      r.status || '',
      `"${r.coordinator?.name || 'Unassigned'}"`,
      `"${(r.latest_summary || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AayuYukthi_Care_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = (req) => {
    window.print();
  };

  if (loading) return <Loading t={{ loading: 'Loading care requests…' }} />;
  if (error) return <LoadError t={{ loadError: 'Could not load care requests.', tryAgain: 'Try again' }} onRetry={() => window.location.reload()} />;

  // CMS content with clean defaults
  const eyebrowText = cmsBlocks['customer.requests.eyebrow']?.body_en || 'Care Requests & Service Logs';
  const titleText = cmsBlocks['customer.requests.title']?.body_en || 'My Care Requests';
  const descriptionText = cmsBlocks['customer.requests.description']?.body_en ||
    'Track upcoming hospital visits, monitor live companion milestones, and access historical doctor notes and discharge dossiers.';

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '2rem 1.5rem 4rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--cust-primary-container)'
            }} />
            <span style={{
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--cust-primary)',
              fontWeight: 700
            }}>
              {eyebrowText}
            </span>
          </div>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--cust-on-surface)',
            letterSpacing: '-0.015em',
            margin: 0,
            lineHeight: 1.2
          }}>
            {titleText}
          </h1>

          <p style={{
            fontSize: '0.9375rem',
            color: 'var(--cust-on-surface-variant)',
            maxWidth: '42rem',
            margin: 0,
            lineHeight: 1.5
          }}>
            {descriptionText}
          </p>
        </div>

        {/* Top Header CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Live Sync Status Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: 'var(--cust-surface-container-lowest)',
            padding: '0.4rem 0.75rem',
            borderRadius: '9999px',
            border: '1px solid rgba(0,0,0,0.06)',
            fontSize: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <span style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '9999px',
              backgroundColor: '#10b981',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
              display: 'inline-block'
            }} />
            <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              {isSyncing ? 'Syncing…' : 'Live Connected'}
            </span>
            {lastSyncedAt && (
              <span style={{ color: 'var(--cust-secondary)', fontSize: '0.6875rem' }}>
                • {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchLiveRequests(false)}
            disabled={isSyncing}
            className="cust-btn-secondary"
            title="Fetch live updates immediately from care coordinator"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                color: 'var(--cust-primary)',
                animation: isSyncing ? 'spin 1s linear infinite' : 'none'
              }}
            >
              sync
            </span>
            <span>{isSyncing ? 'Refreshing…' : 'Refresh Live Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="cust-btn-secondary"
            title="Download care log as CSV"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-secondary)' }}>
              download
            </span>
            <span>Export Care Log</span>
            <span style={{
              fontSize: '0.6875rem',
              color: 'var(--cust-secondary)',
              backgroundColor: 'var(--cust-surface-container)',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem'
            }}>
              CSV
            </span>
          </button>

          <Link to="/request-care" className="cust-btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            <span>Request Care</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <CustomerStatsCards requests={requests} />

      {/* Filter & Control Section */}
      <CustomerRequestFilters
        counts={counts}
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        recipients={recipients}
        selectedRecipient={selectedRecipient}
        onRecipientChange={(r) => {
          setSelectedRecipient(r);
          setCurrentPage(1);
        }}
        hospitals={uniqueHospitals}
        selectedHospital={selectedHospital}
        onHospitalChange={(h) => {
          setSelectedHospital(h);
          setCurrentPage(1);
        }}
        selectedPeriod={selectedPeriod}
        onPeriodChange={(p) => {
          setSelectedPeriod(p);
          setCurrentPage(1);
        }}
      />

      {/* Queued Notice Banner */}
      {searchParams.get('notice') === 'queued' && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 24 }}>info</span>
          <div style={{ fontSize: '14px', color: '#92400e', lineHeight: 1.4 }}>
            <strong>Notice:</strong> Because an active care request is already ongoing for this recipient, your booking was saved as a <strong>Draft</strong>. Once their ongoing request completes, you can activate this draft below.
          </div>
        </div>
      )}

      {/* Action Notification Message */}
      {actionMessage && (
        <div style={{ background: actionMessage.type === 'success' ? '#ecfdf5' : '#fee2e2', border: `1px solid ${actionMessage.type === 'success' ? '#10b981' : '#ef4444'}`, borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" style={{ color: actionMessage.type === 'success' ? '#059669' : '#dc2626', fontSize: 24 }}>
            {actionMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <div style={{ fontSize: '14px', color: actionMessage.type === 'success' ? '#065f46' : '#991b1b', lineHeight: 1.4 }}>
            {actionMessage.text}
          </div>
        </div>
      )}

      {/* Drafts Tab View */}
      {selectedTab === 'DRAFTS' ? (
        drafts.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--cust-surface-container-lowest)',
            borderRadius: '1rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.03)'
          }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--cust-secondary-container)',
              color: 'var(--cust-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>drafts</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '28rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                No queued drafts found
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cust-secondary)' }}>
                When you make a booking for a recipient who already has an ongoing active request, that booking will be safely stored here as a draft.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {drafts.map((d) => (
              <div
                key={d.id}
                style={{
                  backgroundColor: 'var(--cust-surface-container-lowest)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '0.5rem',
                      background: !d.is_complete ? '#fee2e2' : (d.has_active_request ? '#fef3c7' : '#ecfdf5'),
                      color: !d.is_complete ? '#b91c1c' : (d.has_active_request ? '#b45309' : '#047857'),
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {!d.is_complete ? 'edit_note' : (d.has_active_request ? 'hourglass_top' : 'task_alt')}
                      </span>
                      <span>
                        {!d.is_complete
                          ? 'Incomplete Draft (Details Required)'
                          : (d.has_active_request
                              ? 'Queued Draft (Active Request in Progress)'
                              : 'Draft Ready to Activate')}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                      {d.service_title || 'Care Service'} • Patient: {d.recipient_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cust-secondary)' }}>
                      Destination: <strong>{d.hospital_name || 'Hospital Campus'}</strong>
                      {d.payload?.appointment_date && ` • Visit Date: ${d.payload.appointment_date}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!d.is_complete ? (
                      <button
                        type="button"
                        className="cust-btn-primary"
                        onClick={() => handleResumeDraft(d)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 1rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                        <span>Resume Booking</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="cust-btn-primary"
                        disabled={d.has_active_request || activatingId === d.id}
                        onClick={() => handleActivateDraft(d.id)}
                        style={{
                          opacity: d.has_active_request ? 0.6 : 1,
                          cursor: d.has_active_request ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                        title={d.has_active_request ? 'Ongoing active request must complete first' : 'Push this draft to live request'}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
                        <span>{activatingId === d.id ? 'Activating…' : 'Push to Live Request'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(d.id)}
                      disabled={activatingId === d.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: '#fff',
                        color: '#dc2626',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                      title="Discard / Delete this draft"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {!d.is_complete && d.missing_fields?.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    fontSize: '0.8125rem',
                    color: '#991b1b',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#dc2626', flexShrink: 0 }}>warning</span>
                    <span>
                      <strong>Missing Details:</strong> {d.missing_fields.join(', ')}. Click <strong>Resume Booking</strong> to complete these steps.
                    </span>
                  </div>
                )}

                {d.is_complete && d.has_active_request && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    fontSize: '0.8125rem',
                    color: '#92400e',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#d97706', flexShrink: 0 }}>info</span>
                    <span>
                      <strong>Ongoing Request in Progress:</strong> {d.recipient_name} currently has an ongoing active care request. As soon as that request completes or cancels, you can push this draft to live immediately.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : filteredRequests.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--cust-surface-container-lowest)',
          borderRadius: '1rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--cust-secondary-container)',
            color: 'var(--cust-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>assignment_late</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '28rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              No care requests found
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cust-secondary)' }}>
              {searchQuery || selectedRecipient || selectedHospital || selectedTab !== 'ALL'
                ? 'Try adjusting your filters or search terms to find your care requests.'
                : 'You have not submitted any care requests yet. Schedule your first hospital companion visit in under 2 minutes.'}
            </p>
          </div>
          <Link to="/request-care" className="cust-btn-primary" style={{ marginTop: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            <span>Request Care</span>
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fit, minmax(360px, 1fr))' : '1fr',
          gap: '1rem'
        }}>
          {paginatedRequests.map((req) => (
            <CustomerRequestCard
              key={req.id}
              request={req}
              onDownloadPdf={handleDownloadPdf}
            />
          ))}
        </div>
      )}

      {/* Pagination & Bottom Controls */}
      {selectedTab !== 'DRAFTS' && filteredRequests.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: 'var(--cust-surface-container-lowest)',
          padding: '0.875rem 1.25rem',
          borderRadius: '1rem',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
            Showing{' '}
            <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              {Math.min((currentPage - 1) * pageSize + 1, filteredRequests.length)} -{' '}
              {Math.min(currentPage * pageSize, filteredRequests.length)}
            </span>{' '}
            of{' '}
            <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>
              {filteredRequests.length}
            </span>{' '}
            care requests
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--cust-surface-container-low)',
                color: 'var(--cust-secondary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.4 : 1
              }}
              title="Previous Page"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
              const isActive = pg === currentPage;
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.75rem',
                    backgroundColor: isActive ? 'var(--cust-primary-container)' : 'var(--cust-surface-container-low)',
                    color: isActive ? '#ffffff' : 'var(--cust-on-surface)',
                    border: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {pg}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--cust-surface-container-low)',
                color: 'var(--cust-secondary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1
              }}
              title="Next Page"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Reassurance & Support Advisory Strip */}
      <CustomerAdvisoryBanner cmsBlocks={cmsBlocks} />
    </div>
  );
}
