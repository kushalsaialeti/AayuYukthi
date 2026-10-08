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
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Notifications {unread > 0 && <span className="badge" style={{ background: 'var(--color-accent)' }}>{unread}</span>}</h1>
        {unread > 0 && <button className="btn btn-secondary" onClick={markAll}>Mark all read</button>}
      </div>
      {data.length === 0 && <Empty message="No notifications yet." />}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8, marginTop: 16 }}>
        {data.map((n) => (
          <li key={n.id} className="card" style={{ padding: 12, opacity: n.is_read ? 0.75 : 1 }}>
            <strong>{n.title_en}</strong>
            <p className="muted" style={{ margin: '4px 0' }}>{n.body_en}</p>
            <small className="muted">{new Date(n.created_at).toLocaleString()}</small>
            {!n.is_read && <div><button className="btn btn-secondary" style={{ minHeight: 32 }} onClick={() => markOne(n.id)}>Mark read</button></div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SupportList() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useDocumentMeta('Support', 'Help from the AayuYukthi team.');

  const load = () => api.authedTickets().then((d) => setList(d.data)).catch(setError);
  useEffect(() => { load(); }, []);

  if (error) return <LoadError t={{ loadError: 'Could not load support requests.', tryAgain: 'Try again' }} onRetry={load} />;
  if (!list) return <Loading t={{ loading: 'Loading…' }} />;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Support</h1>
        <Link className="btn btn-primary" to="/app/support/new">New request</Link>
      </div>
      {list.length === 0 && <Empty message="No support requests yet." action={<Link className="btn btn-primary" to="/app/support/new">Ask for help</Link>} />}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8, marginTop: 16 }}>
        {list.map((t) => (
          <li key={t.id} className="card" style={{ padding: 12 }}>
            <Link to={`/app/support/${t.id}`}><strong>{t.subject}</strong></Link>
            <span className="badge" style={{ marginLeft: 8, background: 'var(--color-primary-tint)', color: 'var(--color-primary-dark)' }}>
              {t.status.replaceAll('_', ' ')}
            </span>
          </li>
        ))}
      </ul>
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
    api.authedList({ limit: 20 }).then((d) => setRequests(d.data)).catch(() => {});
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
      <div className="card" style={{ maxWidth: 640 }}>
        <h2 style={{ marginTop: 0 }}>Request received</h2>
        <p className="muted">Our team will respond here. <Link to={`/app/support/${created.id}`}>View thread</Link></p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>New support request</h1>
      <form onSubmit={submit} className="card">
        {error && <p className="form-error" role="alert">{error}</p>}
        <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Subject</span>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </label>
        {requests.length > 0 && (
          <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Related request (optional)</span>
            <select className="select" value={requestId} onChange={(e) => setRequestId(e.target.value)}>
              <option value="">None</option>
              {requests.map((r) => <option key={r.id} value={r.id}>{r.service.title} — {r.status}</option>)}
            </select>
          </label>
        )}
        <label style={{ display: 'grid', gap: 4, marginBottom: 16 }}>
          <span style={{ fontWeight: 600 }}>How can we help?</span>
          <textarea className="textarea" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </label>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
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
    <div style={{ maxWidth: 720 }}>
      <p><Link to="/app/support">← Support</Link></p>
      <h1 style={{ marginTop: 0 }}>{detail.ticket.subject}</h1>
      <span className="badge" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary-dark)' }}>
        {detail.ticket.status.replaceAll('_', ' ')}
      </span>
      <div style={{ display: 'grid', gap: 8, margin: '16px 0' }}>
        {detail.messages.map((m) => (
          <div key={m.id} className="card" style={{ padding: 12, background: m.sender_kind === 'customer' ? '#fff' : 'var(--color-primary-tint)' }}>
            <small className="muted">{m.sender_kind === 'customer' ? 'You' : 'AayuYukthi team'} · {new Date(m.created_at).toLocaleString()}</small>
            <p style={{ margin: '4px 0 0' }}>{m.message}</p>
          </div>
        ))}
      </div>
      {!closed ? (
        <form onSubmit={send} className="card">
          {error && <p className="form-error" role="alert">{error.message}</p>}
          <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Reply</span>
            <textarea className="textarea" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={busy || !message.trim()}>Send reply</button>
            <button type="button" className="btn btn-secondary" onClick={close}>Close request</button>
          </div>
        </form>
      ) : (
        <p className="muted">This request is {detail.ticket.status}. Open a <Link to="/app/support/new">new request</Link> if you need more help.</p>
      )}
    </div>
  );
}
