import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { track } from '../analytics.js';
import { useDocumentMeta, Loading, LoadError, Empty } from '../components/layout.jsx';

export function NotificationsPage() {
  const [data, setData] = useState(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState(null);

  useDocumentMeta('Notifications', 'Updates on your requests and support.');

  const load = async () => {
    setError(null);
    try {
      const res = await api.authedNotifications();
      setData(res.data);
      setUnread(res.meta.unreadCount);
    } catch (e) {
      setError(e);
    }
  };
  useEffect(() => { load(); }, []);

  const markOne = async (id) => {
    track('NOTIFICATION_VIEWED');
    await api.authedNotificationRead(id);
    await load();
  };
  const markAll = async () => {
    await api.authedNotificationsReadAll();
    await load();
  };

  if (error) return <LoadError t={{ loadError: 'Could not load notifications.', tryAgain: 'Try again' }} onRetry={load} />;
  if (!data) return <Loading t={{ loading: 'Loading…' }} />;

  return (
    <div className="support-page-shell">
      <div className="support-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h1 className="support-page-title">Notifications</h1>
          {unread > 0 && (
            <span className="notif-unread-badge">{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button className="cust-btn-secondary" onClick={markAll}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>done_all</span>
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="support-empty-state">
          <div className="support-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>notifications_none</span>
          </div>
          <h3>No notifications yet</h3>
          <p>You'll see updates about your care requests here.</p>
        </div>
      ) : (
        <div className="support-list">
          {data.map((n) => (
            <div key={n.id} className={`cust-card notif-card ${n.is_read ? 'is-read' : ''}`}>
              <div className="notif-card-body">
                <div className="notif-card-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {n.is_read ? 'notifications' : 'notifications_active'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--cust-on-surface)' }}>{n.title_en}</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--cust-secondary)', lineHeight: 1.45 }}>{n.body_en}</p>
                  <small style={{ fontSize: '0.75rem', color: 'var(--cust-outline)' }}>{new Date(n.created_at).toLocaleString()}</small>
                </div>
                {!n.is_read && (
                  <button className="cust-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', flexShrink: 0 }} onClick={() => markOne(n.id)}>
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SupportList() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useDocumentMeta('Support', 'Get help from the AayuYukthi team.');

  const load = () => api.authedTickets().then((d) => setList(d.data)).catch(setError);
  useEffect(() => { load(); }, []);

  if (error) return <LoadError t={{ loadError: 'Could not load support requests.', tryAgain: 'Try again' }} onRetry={load} />;
  if (!list) return <Loading t={{ loading: 'Loading…' }} />;

  return (
    <div className="support-page-shell">
      <div className="support-page-header">
        <h1 className="support-page-title">Support</h1>
        <Link className="cust-btn-primary" to="/app/support/new">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          <span>New Request</span>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="support-empty-state">
          <div className="support-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>headset_mic</span>
          </div>
          <h3>No support requests</h3>
          <p>Need help? Our team is here for you.</p>
          <Link className="cust-btn-primary" to="/app/support/new" style={{ marginTop: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span>Ask for Help</span>
          </Link>
        </div>
      ) : (
        <div className="support-list">
          {list.map((t) => (
            <Link key={t.id} to={`/app/support/${t.id}`} className="cust-card support-ticket-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <div className="support-ticket-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat_bubble_outline</span>
                  </div>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--cust-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.subject}
                  </strong>
                </div>
                <span className="support-status-badge">
                  {t.status.replaceAll('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SupportNew() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    api.authedList({ limit: 20 }).then((d) => setRequests(d.data)).catch(() => { });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.authedTicketCreate({ subject, message, request_id: requestId || null });
      track('SUPPORT_REQUEST_CREATED');
      setCreated(res.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="support-page-shell">
        <div className="cust-card" style={{ maxWidth: '640px', padding: '2rem', textAlign: 'center' }}>
          <div className="support-empty-icon" style={{ margin: '0 auto 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#059669' }}>check_circle</span>
          </div>
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--cust-on-surface)' }}>Request Received</h2>
          <p style={{ color: 'var(--cust-secondary)', margin: '0 0 1rem' }}>
            Our team will respond shortly.
          </p>
          <Link to={`/app/support/${created.id}`} className="cust-btn-primary">View Thread</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="support-page-shell">
      <nav className="profile-breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/app/support">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>headset_mic</span>
          <span>Support</span>
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-outline-variant)' }}>chevron_right</span>
        <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>New Request</span>
      </nav>

      <h1 className="support-page-title" style={{ marginBottom: '1rem' }}>New Support Request</h1>

      <form onSubmit={submit} className="cust-card support-form" style={{ maxWidth: '640px' }}>
        {error && <p className="support-form-error" role="alert">{error}</p>}

        <label className="support-form-field">
          <span className="support-form-label">Subject</span>
          <input
            className="support-form-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Brief summary of your issue"
          />
        </label>

        {requests.length > 0 && (
          <label className="support-form-field">
            <span className="support-form-label">Related Request (optional)</span>
            <select className="support-form-input" value={requestId} onChange={(e) => setRequestId(e.target.value)}>
              <option value="">None</option>
              {requests.map((r) => <option key={r.id} value={r.id}>{r.service.title} — {r.status}</option>)}
            </select>
          </label>
        )}

        <label className="support-form-field">
          <span className="support-form-label">How can we help?</span>
          <textarea
            className="support-form-input support-form-textarea"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Describe your issue or question in detail…"
          />
        </label>

        <button className="cust-btn-primary" disabled={busy} style={{ alignSelf: 'flex-start' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
          <span>{busy ? 'Sending…' : 'Send Request'}</span>
        </button>
      </form>
    </div>
  );
}

export function SupportThread() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.authedTicket(id).then(setDetail).catch(setError);
  useEffect(() => { load(); }, [id]);

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setDetail(await api.authedTicketReply(id, message));
      setMessage('');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    try {
      setDetail(await api.authedTicketClose(id));
    } catch (err) {
      setError(err);
    }
  };

  if (error && !detail) return <LoadError t={{ loadError: 'Could not load this thread.', tryAgain: 'Try again' }} onRetry={load} />;
  if (!detail) return <Loading t={{ loading: 'Loading…' }} />;

  const closed = ['resolved', 'closed'].includes(detail.ticket.status);

  return (
    <div className="support-page-shell">
      <nav className="profile-breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/app/support">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>headset_mic</span>
          <span>Support</span>
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-outline-variant)' }}>chevron_right</span>
        <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>Thread</span>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h1 className="support-page-title" style={{ margin: 0 }}>{detail.ticket.subject}</h1>
        <span className="support-status-badge">{detail.ticket.status.replaceAll('_', ' ')}</span>
      </div>

      <div className="support-thread-messages">
        {detail.messages.map((m) => (
          <div key={m.id} className={`cust-card support-message ${m.sender_kind === 'customer' ? 'is-mine' : 'is-team'}`}>
            <div className="support-message-meta">
              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--cust-on-surface)' }}>
                {m.sender_kind === 'customer' ? 'You' : 'AayuYukthi Team'}
              </span>
              <small style={{ fontSize: '0.75rem', color: 'var(--cust-outline)' }}>
                {new Date(m.created_at).toLocaleString()}
              </small>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: 'var(--cust-on-surface-variant)', lineHeight: 1.55 }}>{m.message}</p>
          </div>
        ))}
      </div>

      {!closed ? (
        <form onSubmit={send} className="cust-card support-reply-form">
          {error && <p className="support-form-error" role="alert">{error.message}</p>}

          <label className="support-form-field">
            <span className="support-form-label">Reply</span>
            <textarea
              className="support-form-input support-form-textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="Type your reply…"
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="cust-btn-primary" disabled={busy || !message.trim()}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
              <span>{busy ? 'Sending…' : 'Send Reply'}</span>
            </button>
            <button type="button" className="cust-btn-secondary" onClick={close}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
              <span>Close Request</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="cust-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'var(--cust-secondary)', fontSize: '0.875rem' }}>
            This request is {detail.ticket.status}. <Link to="/app/support/new" style={{ color: 'var(--cust-primary)', fontWeight: 600 }}>Open a new request</Link> if you need more help.
          </p>
        </div>
      )}
    </div>
  );
}
