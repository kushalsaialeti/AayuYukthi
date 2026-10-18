import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useDocumentMeta, Loading, LoadError } from '../components/layout.jsx';
import { CustomerRequestCard } from '../components/customer/CustomerRequestCard.jsx';
import '../components/customer/customer.css';

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
  useDocumentMeta('My Requests', 'Track your hospital visits and care requests.');

  const [requests, setRequests] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Simplified tab state: ALL | ACTIVE | COMPLETED
  const [selectedTab, setSelectedTab] = useState(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab.toUpperCase();
    return 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
    try {
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab.toLowerCase());
        return n;
      }, { replace: true });
    } catch {}
  };

  const fetchRequests = async () => {
    try {
      const [reqsData, draftsData] = await Promise.all([
        api.authedList({ limit: 100 }).catch(() => ({ data: [] })),
        api.authedDraftsList().catch(() => ({ data: [] })),
      ]);
      setRequests(reqsData?.data || []);
      setDrafts(draftsData?.data || draftsData || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateDraft = async (draftId) => {
    setActivatingId(draftId);
    setActionMessage(null);
    try {
      await api.authedDraftActivate(draftId);
      setActionMessage({ type: 'success', text: 'Care request activated successfully.' });
      await fetchRequests();
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
      setActionMessage({ type: 'success', text: 'Draft deleted.' });
      await fetchRequests();
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

  // Initial load + background sync (60s interval, not 15s)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchRequests();

    const pollInterval = setInterval(() => {
      if (mounted && document.visibilityState === 'visible') {
        fetchRequests();
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Compute counts
  const counts = useMemo(() => {
    const list = requests || [];
    return {
      all: list.length,
      active: list.filter((r) => ACTIVE_STATUSES.has(r.status)).length,
      completed: list.filter((r) => r.status === 'COMPLETED').length,
      drafts: (drafts || []).length,
    };
  }, [requests, drafts]);

  // Filter logic - simplified
  const filteredRequests = useMemo(() => {
    let list = requests || [];

    if (selectedTab === 'ACTIVE') {
      list = list.filter((r) => ACTIVE_STATUSES.has(r.status));
    } else if (selectedTab === 'COMPLETED') {
      list = list.filter((r) => r.status === 'COMPLETED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const hospName = (r.hospital?.name || '').toLowerCase();
        const recName = (r.recipient?.name || '').toLowerCase();
        const servTitle = (r.service?.title || '').toLowerCase();
        return hospName.includes(q) || recName.includes(q) || servTitle.includes(q);
      });
    }

    return list;
  }, [requests, selectedTab, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  if (loading) return <Loading t={{ loading: 'Loading your requests…' }} />;
  if (error) return <LoadError t={{ loadError: 'Could not load requests.', tryAgain: 'Try again' }} onRetry={() => window.location.reload()} />;

  // Simplified tabs: All, Active, Completed + Drafts if any
  const tabs = [
    { key: 'ALL', label: 'All', count: counts.all },
    { key: 'ACTIVE', label: 'Active', count: counts.active },
    { key: 'COMPLETED', label: 'Completed', count: counts.completed },
  ];
  if (counts.drafts > 0) {
    tabs.push({ key: 'DRAFTS', label: 'Drafts', count: counts.drafts });
  }

  return (
    <div className="requests-page-shell">
      {/* Page Header */}
      <div className="requests-page-header">
        <div>
          <h1 className="requests-page-title">My Requests</h1>
          <p className="requests-page-desc">
            Track your hospital visits and manage care requests.
          </p>
        </div>
        <Link to="/request-care" className="cust-btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
          <span>Request Care</span>
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="requests-filter-bar">
        <div className="requests-tabs">
          {tabs.map((t) => {
            const isActive = selectedTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={`requests-tab ${isActive ? 'active' : ''}`}
              >
                <span>{t.label}</span>
                <span className="requests-tab-count">{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="requests-search-bar">
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-secondary)' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search by hospital, recipient, or service…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="requests-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="requests-search-clear"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      {/* Queued Notice Banner */}
      {searchParams.get('notice') === 'queued' && (
        <div className="requests-notice-banner warn">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>info</span>
          <span>
            Your booking was saved as a <strong>Draft</strong> because this recipient already has an active request. You can activate it once their current request completes.
          </span>
        </div>
      )}

      {/* Action Message */}
      {actionMessage && (
        <div className={`requests-notice-banner ${actionMessage.type === 'success' ? 'success' : 'error'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {actionMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Drafts Tab View */}
      {selectedTab === 'DRAFTS' ? (
        drafts.length === 0 ? (
          <div className="requests-empty-state">
            <div className="requests-empty-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>drafts</span>
            </div>
            <h3>No drafts</h3>
            <p>Drafts are created when a recipient already has an active request.</p>
          </div>
        ) : (
          <div className="requests-list">
            {drafts.map((d) => (
              <div key={d.id} className="cust-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div className={`requests-draft-badge ${!d.is_complete ? 'incomplete' : d.has_active_request ? 'queued' : 'ready'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {!d.is_complete ? 'edit_note' : (d.has_active_request ? 'hourglass_top' : 'task_alt')}
                      </span>
                      <span>
                        {!d.is_complete ? 'Incomplete' : (d.has_active_request ? 'Queued' : 'Ready')}
                      </span>
                    </div>

                    <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1rem', fontWeight: 600, color: 'var(--cust-on-surface)' }}>
                      {d.service_title || 'Care Service'} — {d.recipient_name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--cust-secondary)' }}>
                      {d.hospital_name || 'Hospital'}
                      {d.payload?.appointment_date && ` · ${d.payload.appointment_date}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!d.is_complete ? (
                      <button
                        type="button"
                        className="cust-btn-primary"
                        onClick={() => handleResumeDraft(d)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="cust-btn-primary"
                        disabled={d.has_active_request || activatingId === d.id}
                        onClick={() => handleActivateDraft(d.id)}
                        style={{ opacity: d.has_active_request ? 0.6 : 1, cursor: d.has_active_request ? 'not-allowed' : 'pointer' }}
                        title={d.has_active_request ? 'Wait for current request to complete' : 'Activate this draft'}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
                        <span>{activatingId === d.id ? 'Activating…' : 'Activate'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(d.id)}
                      disabled={activatingId === d.id}
                      className="cust-btn-secondary"
                      style={{ color: 'var(--cust-error)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {!d.is_complete && d.missing_fields?.length > 0 && (
                  <div className="requests-notice-banner warn" style={{ marginTop: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
                    <span>Missing: {d.missing_fields.join(', ')}. Click <strong>Resume</strong> to complete.</span>
                  </div>
                )}

                {d.is_complete && d.has_active_request && (
                  <div className="requests-notice-banner warn" style={{ marginTop: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
                    <span>{d.recipient_name} has an ongoing request. This draft can be activated once it completes.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : filteredRequests.length === 0 ? (
        <div className="requests-empty-state">
          <div className="requests-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>assignment</span>
          </div>
          <h3>No requests found</h3>
          <p>
            {searchQuery || selectedTab !== 'ALL'
              ? 'Try adjusting your search or filter.'
              : 'You haven\'t made any care requests yet.'}
          </p>
          {!searchQuery && selectedTab === 'ALL' && (
            <Link to="/request-care" className="cust-btn-primary" style={{ marginTop: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
              <span>Request Care</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="requests-list">
          {paginatedRequests.map((req) => (
            <CustomerRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {selectedTab !== 'DRAFTS' && filteredRequests.length > pageSize && (
        <div className="requests-pagination">
          <span className="requests-pagination-info">
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredRequests.length)}–{Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length}
          </span>

          <div className="requests-pagination-btns">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="requests-page-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`requests-page-btn ${pg === currentPage ? 'active' : ''}`}
              >
                {pg}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="requests-page-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
