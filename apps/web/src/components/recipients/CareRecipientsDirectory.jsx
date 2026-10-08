import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useCustomerAuth } from '../../auth.jsx';
import { Loading } from '../layout.jsx';
import { RecipientDirectoryStats } from './RecipientDirectoryStats.jsx';
import { RecipientFilterTabs } from './RecipientFilterTabs.jsx';
import { RecipientCard } from './RecipientCard.jsx';
import { CareRecipientAddForm } from './CareRecipientAddForm.jsx';
import { CustomerSidebar } from '../customer/CustomerSidebar.jsx';
import { CustomerHeader } from '../customer/CustomerHeader.jsx';
import { CustomerLayoutContext } from '../../pages/Customer.jsx';
import './recipients-view.css';

const ACTIVE_STATUSES = new Set([
  'REQUEST_RECEIVED',
  'UNDER_REVIEW',
  'COORDINATION_IN_PROGRESS',
  'CONFIRMED',
  'SCHEDULED',
  'SERVICE_IN_PROGRESS',
]);

export function CareRecipientsDirectory({ forceNew = false }) {
  const { user } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [recipients, setRecipients] = useState(null);
  const [requests, setRequests] = useState([]);
  const [cmsConfig, setCmsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customer layout detection (standalone vs layout-wrapped)
  const isInsideLayout = useContext(CustomerLayoutContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isInsideLayout) return;
    let active = true;
    api.authedNotifications({ limit: 20 })
      .then((res) => {
        if (!active) return;
        const unread = (res?.data || []).filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isInsideLayout]);

  // View state - Persisted across refreshes
  const [isAdding, setIsAdding] = useState(() => {
    if (forceNew) return true;
    if (searchParams.get('new') === '1') return true;
    try {
      return sessionStorage.getItem('ay_recipients_adding') === 'true';
    } catch {
      return false;
    }
  });
  const [editingRecipient, setEditingRecipient] = useState(null);

  // Filter & Sort - Persisted across refreshes
  const [activeFilter, setActiveFilter] = useState(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter) return urlFilter.toLowerCase();
    try {
      const cached = sessionStorage.getItem('ay_recipients_filter');
      if (cached) return cached;
    } catch {}
    return 'all';
  });
  const [isSortAsc, setIsSortAsc] = useState(true);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    try {
      sessionStorage.setItem('ay_recipients_filter', filter);
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        n.set('filter', filter);
        return n;
      }, { replace: true });
    } catch {}
  };

  const handleSetIsAdding = (val) => {
    setIsAdding(val);
    try {
      sessionStorage.setItem('ay_recipients_adding', val ? 'true' : 'false');
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        if (val) n.set('new', '1');
        else n.delete('new');
        return n;
      }, { replace: true });
    } catch {}
  };

  useEffect(() => {
    const handleAddEvent = () => {
      setEditingRecipient(null);
      handleSetIsAdding(true);
    };
    window.addEventListener('ay:add-recipient', handleAddEvent);
    return () => {
      window.removeEventListener('ay:add-recipient', handleAddEvent);
    };
  }, []);

  useEffect(() => {
    if (forceNew || searchParams.get('new') === '1') {
      setIsAdding(true);
    }
  }, [forceNew, searchParams]);

  // Load live recipients & active care requests
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recRes, reqRes, cmsRes] = await Promise.all([
        api.recipients({ limit: 50 }),
        api.authedList({ limit: 50 }).catch(() => ({ data: [] })),
        api.block('recipients_view.config').catch(() => null),
      ]);

      setRecipients(recRes?.data || []);
      setRequests(reqRes?.data || []);
      if (cmsRes?.body_en) {
        try {
          setCmsConfig(JSON.parse(cmsRes.body_en));
        } catch {}
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (forceNew) {
      setIsAdding(true);
      setEditingRecipient(null);
    }
  }, [forceNew]);

  // Find the immediate upcoming visit across all active requests
  const upcomingVisitMap = useMemo(() => {
    const map = {};
    const activeRequests = requests
      .filter((r) => ACTIVE_STATUSES.has(r.status))
      .sort((a, b) => new Date(a.scheduled_start_time || a.created_at) - new Date(b.scheduled_start_time || b.created_at));

    for (const req of activeRequests) {
      if (req.recipient_id && !map[req.recipient_id]) {
        let displayTime = 'Scheduled Visit';
        if (req.scheduled_start_time) {
          try {
            const d = new Date(req.scheduled_start_time);
            displayTime = d.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
          } catch {}
        }
        map[req.recipient_id] = {
          id: req.id,
          displayTime,
          serviceName: req.service_name || 'Care Consultation',
          hospitalName: req.hospital_name || 'Hospital',
          statusText: req.status.replace(/_/g, ' '),
        };
      }
    }
    return map;
  }, [requests]);

  // Earliest upcoming visit overall for the top stats card
  const earliestVisit = useMemo(() => {
    const active = requests
      .filter((r) => ACTIVE_STATUSES.has(r.status))
      .sort((a, b) => new Date(a.scheduled_start_time || a.created_at) - new Date(b.scheduled_start_time || b.created_at))[0];

    if (!active) return null;

    const matchedRec = (recipients || []).find((rec) => rec.id === active.recipient_id);
    let displayTime = 'Upcoming';
    if (active.scheduled_start_time) {
      try {
        const d = new Date(active.scheduled_start_time);
        displayTime = d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {}
    }

    return {
      id: active.id,
      displayTime,
      recipientName: matchedRec?.full_name || 'Care Recipient',
      hospitalName: active.hospital_name || 'Hospital',
      statusText: active.status.replace(/_/g, ' '),
    };
  }, [requests, recipients]);

  // Handle deletion of recipient
  const handleRemove = async (id) => {
    if (!window.confirm('Remove this care recipient? This cannot be undone.')) return;
    try {
      await api.deleteRecipient(id);
      await loadData();
    } catch (err) {
      alert(err.code === 'RECIPIENT_IN_USE'
        ? 'This person is linked to an active care request and cannot be removed.'
        : (err.message || 'Failed to remove recipient.'));
    }
  };

  const handleEdit = (recipient) => {
    setEditingRecipient(recipient);
    setIsAdding(false);
  };

  const handleSaved = (savedRecipient, mode) => {
    setIsAdding(false);
    setEditingRecipient(null);
    if (mode === 'request-care') {
      navigate('/request-care');
    } else {
      loadData();
    }
  };

  // Filtered & Sorted Recipients
  const filteredRecipients = useMemo(() => {
    if (!recipients) return [];
    let list = [...recipients];

    if (activeFilter === 'active') {
      // Show recipients who have an active upcoming request or are marked primary
      list = list.filter((r, idx) => idx === 0 || !!upcomingVisitMap[r.id]);
    } else if (activeFilter === 'archived') {
      return [];
    }

    list.sort((a, b) => {
      const nameA = a.full_name.toLowerCase();
      const nameB = b.full_name.toLowerCase();
      return isSortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return list;
  }, [recipients, activeFilter, isSortAsc, upcomingVisitMap]);

  // If in Add or Edit form mode: render the modular CareRecipientAddForm
  const wrapWithShell = (children) => {
    if (isInsideLayout) return children;
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--cust-surface)' }}>
        <CustomerSidebar
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          unreadCount={unreadCount}
        />
        <CustomerHeader
          isCollapsed={isCollapsed}
          unreadCount={unreadCount}
        />
        <main className={`customer-main-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
          {children}
        </main>
      </div>
    );
  };

  if (isAdding || editingRecipient) {
    return wrapWithShell(
      <CareRecipientAddForm
        initialData={editingRecipient}
        user={user}
        onSuccess={handleSaved}
        onCancel={() => {
          handleSetIsAdding(false);
          setEditingRecipient(null);
          if (forceNew) navigate('/app/recipients');
        }}
      />
    );
  }

  if (loading && !recipients) {
    return wrapWithShell(
      <div className="rc-page-container">
        <Loading t={{ loading: 'Loading care recipients directory…' }} />
      </div>
    );
  }

  const totalCount = recipients?.length || 0;
  const activeCount = recipients ? recipients.filter((r, idx) => idx === 0 || !!upcomingVisitMap[r.id]).length : 0;

  return wrapWithShell(
    <div className="rc-page-container">
      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#ffdad6', color: '#93000a', fontWeight: 600 }}>
          {error.message || 'Could not load directory.'}
        </div>
      )}

      {/* Quick Stats Highlights Strip */}
      <RecipientDirectoryStats
        recipients={recipients || []}
        upcomingVisit={earliestVisit}
      />

      {/* Filter Segment Tabs & Quick Search */}
      <RecipientFilterTabs
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        totalCount={totalCount}
        activeCount={activeCount}
        filteredCount={filteredRecipients.length}
        onSortToggle={() => setIsSortAsc((prev) => !prev)}
        isSortAsc={isSortAsc}
      />

      {/* Recipients Detailed Cards Grid */} 
      {totalCount === 0 ? (
        <div className="rc-empty-card">
          <div className="rc-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>family_restroom</span>
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#191c1c' }}>
            No care recipients configured yet
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: '#4b6077', fontSize: '14px', maxWidth: '420px', lineHeight: 1.5 }}>
            Add your family members or loved ones to coordinate hospital visits, wheelchair logistics, and companion escorts.
          </p>
          <button
            type="button"
            className="rc-btn-add"
            onClick={() => {
              setEditingRecipient(null);
              handleSetIsAdding(true);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            <span>Add Care Recipient</span>
          </button>
        </div>
      ) : filteredRecipients.length === 0 ? (
        <div className="rc-empty-card" style={{ padding: '2rem 1.5rem' }}>
          <p style={{ margin: 0, color: '#4b6077', fontSize: '14px' }}>
            No recipients match the selected tab filter.
          </p>
        </div>
      ) : (
        <div className="rc-cards-list">
          {filteredRecipients.map((recipient, idx) => (
            <RecipientCard
              key={recipient.id}
              recipient={recipient}
              index={idx}
              upcomingVisit={upcomingVisitMap[recipient.id] || null}
              currentUser={user}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onRequestCare={(recipientId) => navigate(`/request-care?recipientId=${recipientId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
