import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorAlert, EmptyState, useFormState } from '../components/ui.jsx';
import { useToast } from '../components/OpsToast.jsx';

const TICKET_STATUSES = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'resolved':
    case 'closed':
      return 'ops-badge-confirmed';
    case 'in_progress':
      return 'ops-badge-active';
    case 'waiting_on_customer':
      return 'ops-badge-pending';
    case 'open':
    default:
      return 'ops-badge-action-required';
  }
};

const getPriorityBadgeClass = (p) => {
  switch (p) {
    case 'urgent':
      return 'ops-badge-action-required';
    case 'high':
      return 'ops-badge-pending';
    case 'normal':
      return 'ops-badge-active';
    case 'low':
    default:
      return 'ops-badge-archived';
  }
};

export function SupportQueue() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', assigned: '' });

  const load = async (f = filters) => {
    setError(null);
    try {
      const params = { page: '1', limit: '50' };
      if (f.q) params.q = f.q;
      if (f.status) params.status = f.status;
      if (f.assigned) params.assigned = f.assigned;
      setData(await api.list('support', params));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusFilter = (st) => {
    const updated = { ...filters, status: filters.status === st ? '' : st };
    setFilters(updated);
    load(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
            Support Desk &amp; Patient Inquiries
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
            Customer inquiries, companion assistance questions, and resolution tickets.
          </p>
        </div>
        <button
          type="button"
          className="ops-btn ops-btn-secondary"
          onClick={() => load(filters)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sync</span>
          Refresh Desk
        </button>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          className={`ops-btn ops-btn-sm ${!filters.status ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
          onClick={() => handleStatusFilter('')}
        >
          All Tickets
        </button>
        {TICKET_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`ops-btn ops-btn-sm ${filters.status === s ? 'ops-btn-primary' : 'ops-btn-secondary'}`}
            onClick={() => handleStatusFilter(s)}
          >
            {s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {/* Search & Assignee toolbar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(filters);
        }}
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ops-outline)',
              fontSize: '18px',
            }}
          >
            search
          </span>
          <input
            className="ops-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search tickets by subject or customer name…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>

        <select
          className="ops-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filters.assigned}
          onChange={(e) => {
            const updated = { ...filters, assigned: e.target.value };
            setFilters(updated);
            load(updated);
          }}
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned Only</option>
        </select>

        <button className="ops-btn ops-btn-secondary" type="submit">
          Apply Filter
        </button>
      </form>

      <ErrorAlert error={error} onRetry={() => load(filters)} />

      {!data && !error && (
        <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading tickets…</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState message="No support tickets match your filter criteria." />
      )}

      {data && data.data.length > 0 && (
        <div className="ops-table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Subject &amp; Inquiry</th>
                <th>Customer Details</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned Staff</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--ops-on-surface)' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>Ticket #{t.id.slice(0, 8)}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>{t.customer_email}</div>
                  </td>
                  <td>
                    <span className={`ops-badge ${getStatusBadgeClass(t.status)}`}>
                      {t.status.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`ops-badge ${getPriorityBadgeClass(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    {t.assignee_name ? (
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{t.assignee_name}</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ops-outline)' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/support/${t.id}`}
                      className="ops-btn ops-btn-secondary ops-btn-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                      Open Thread
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SupportDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [team, setTeam] = useState([]);
  const [error, setError] = useState(null);
  const [values, set, setValues] = useFormState({
    message: '',
    is_internal: false,
    to_status: '',
    priority: '',
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = async () => {
    setError(null);
    try {
      const [d, teamList] = await Promise.all([api.get('support', id), api.getOne('customers/team')]);
      setDetail(d);
      setTeam(teamList);
      setValues((v) => ({ ...v, priority: d.ticket.priority }));
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const mutate = async (fn, successMsg = 'Updated successfully') => {
    setBusy(true);
    setError(null);
    try {
      setDetail(await fn());
      toast.success(successMsg);
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Operation failed');
    } finally {
      setBusy(false);
    }
  };

  const send = (e) => {
    e.preventDefault();
    mutate(
      () =>
        api
          .raw(`/ops/support/${id}/messages`, 'POST', {
            message: values.message,
            is_internal: values.is_internal,
          })
          .then(() => {
            setValues((v) => ({ ...v, message: '' }));
            return api.get('support', id);
          }),
      values.is_internal ? 'Internal note added' : 'Reply sent to customer'
    );
  };

  if (error && !detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link to="/support" className="ops-btn ops-btn-secondary ops-btn-sm" style={{ width: 'fit-content' }}>
          ← Back to Support
        </Link>
        <ErrorAlert error={error} onRetry={load} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="ops-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ margin: 0, color: 'var(--ops-outline)' }}>Loading ticket conversation…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Link
          to="/support"
          className="ops-btn ops-btn-secondary ops-btn-sm"
          style={{ width: 'fit-content', marginBottom: '0.75rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Support Tickets
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ops-outline)', textTransform: 'uppercase' }}>
              Ticket #{detail.ticket.id.slice(0, 8)}
            </span>
            <h1 style={{ margin: '0.2rem 0 0', fontSize: '1.625rem', fontWeight: 800, color: 'var(--ops-primary)' }}>
              {detail.ticket.subject}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`ops-badge ${getPriorityBadgeClass(detail.ticket.priority)}`}>
              Priority: {detail.ticket.priority}
            </span>
            <span className={`ops-badge ${getStatusBadgeClass(detail.ticket.status)}`}>
              {detail.ticket.status.replaceAll('_', ' ')}
            </span>
          </div>
        </div>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--ops-outline)' }}>
          Customer: <strong>{detail.ticket.customer_name}</strong> · {detail.ticket.customer_email}
          {detail.ticket.customer_phone ? ` · ${detail.ticket.customer_phone}` : ''}
        </p>
      </div>

      <ErrorAlert error={error} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Thread Column */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                forum
              </span>
              Conversation History
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {detail.messages.map((m) => {
              const isStaff = m.sender_kind !== 'customer';
              return (
                <div
                  key={m.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--ops-radius-md)',
                    backgroundColor: m.is_internal
                      ? '#fffbeb'
                      : isStaff
                      ? 'var(--ops-surface-container-low)'
                      : '#ffffff',
                    border: m.is_internal
                      ? '1px solid #fef3c7'
                      : '1px solid var(--ops-outline-subtle)',
                    borderLeft: m.is_internal
                      ? '4px solid #f59e0b'
                      : isStaff
                      ? '4px solid var(--ops-primary)'
                      : '4px solid var(--ops-outline)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.is_internal ? '#92400e' : 'var(--ops-on-surface)' }}>
                      {m.is_internal ? 'Staff Internal Note (Private)' : isStaff ? 'Support Representative' : 'Customer'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--ops-outline)' }}>
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ops-on-surface)', lineHeight: 1.45 }}>
                    {m.message}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--ops-outline-subtle)' }}>
            <div className="ops-form-field">
              <textarea
                className="ops-textarea"
                rows={3}
                value={values.message}
                onChange={set('message')}
                placeholder={values.is_internal ? 'Add private internal coordination note…' : 'Type reply message sent to customer…'}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  style={{ accentColor: 'var(--ops-primary)', width: '1rem', height: '1rem' }}
                  checked={values.is_internal}
                  onChange={set('is_internal')}
                />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: values.is_internal ? '#b45309' : 'var(--ops-on-surface)' }}>
                  Internal note only (Hidden from customer)
                </span>
              </label>

              <button
                type="submit"
                className="ops-btn ops-btn-primary"
                disabled={busy || !values.message.trim()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                {values.is_internal ? 'Post Note' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>

        {/* Ticket Management Panel */}
        <div className="ops-card">
          <div className="ops-card-header">
            <h2 className="ops-card-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--ops-primary)' }}>
                tune
              </span>
              Ticket Controls
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Status Change */}
            <div className="ops-form-field">
              <label className="ops-form-label">Workflow Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="ops-select"
                  value={values.to_status}
                  onChange={set('to_status')}
                >
                  <option value="">Choose new status…</option>
                  {TICKET_STATUSES.filter((s) => s !== detail.ticket.status).map((s) => (
                    <option key={s} value={s}>
                      → {s.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="ops-btn ops-btn-secondary"
                  disabled={busy || !values.to_status}
                  onClick={() =>
                    mutate(
                      () =>
                        api.raw(`/ops/support/${id}/status`, 'PATCH', { to_status: values.to_status }),
                      'Ticket status changed'
                    )
                  }
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Assignee */}
            <div className="ops-form-field">
              <label className="ops-form-label">Assigned Staff Member</label>
              <select
                className="ops-select"
                value={detail.ticket.assigned_to ?? ''}
                onChange={(e) =>
                  mutate(
                    () =>
                      api.raw(`/ops/support/${id}/assign`, 'PATCH', {
                        assigned_to: e.target.value || null,
                      }),
                    e.target.value ? 'Staff member assigned' : 'Ticket unassigned'
                  )
                }
              >
                <option value="">-- Unassigned --</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="ops-form-field">
              <label className="ops-form-label">Inquiry Priority</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="ops-select"
                  value={values.priority}
                  onChange={set('priority')}
                >
                  {['low', 'normal', 'high', 'urgent'].map((p) => (
                    <option key={p} value={p}>
                      {p.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="ops-btn ops-btn-secondary"
                  disabled={busy}
                  onClick={() =>
                    mutate(
                      () =>
                        api.raw(`/ops/support/${id}/priority`, 'PATCH', { priority: values.priority }),
                      'Priority level saved'
                    )
                  }
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
