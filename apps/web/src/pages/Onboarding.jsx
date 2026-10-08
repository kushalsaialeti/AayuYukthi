import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, tokenStore } from '../api.js';
import { useCustomerAuth } from '../auth.jsx';
import { useDocumentMeta, Loading, LoadError, Empty } from '../components/layout.jsx';
import { OnboardingSuccess } from './OnboardingSuccess.jsx';
export { OnboardingSuccess };

// Guided onboarding: profile → care recipient → done.
// State is re-read from the backend each step, so refresh never loses progress.
const STEPS = ['profile', 'recipient', 'done'];

export function Onboarding() {
  const { user, setUser } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [me, setMe] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [error, setError] = useState(null);
  const [justCompleted, setJustCompleted] = useState(searchParams.get('success') === 'true');

  useDocumentMeta('Get set up', 'Complete your profile and add a care recipient.');

  const load = async (isCompleting = false) => {
    setError(null);
    try {
      const [profile, list] = await Promise.all([api.me(), api.recipients({ limit: 20 })]);
      setMe(profile);
      setRecipients(list.data);
      try {
        sessionStorage.setItem('ay-user', JSON.stringify(profile));
      } catch { /* private mode */ }
      setUser(profile);
      if (isCompleting) {
        setJustCompleted(true);
        return;
      }
      if (profile.onboarding_completed_at && !justCompleted && searchParams.get('success') !== 'true') {
        navigate('/app', { replace: true });
      }
    } catch (e) {
      setError(e);
    }
  };
  useEffect(() => { load(); }, []);

  if (error) return <LoadError t={{ loadError: 'Could not load your account.', tryAgain: 'Try again' }} onRetry={() => load()} />;
  if (!me) return <Loading t={{ loading: 'Loading…' }} />;

  const step = !me.full_name ? 'profile' : (recipients?.length ?? 0) === 0 ? 'recipient' : 'done';
  const stepIndex = STEPS.indexOf(step);

  if (step === 'done' || justCompleted) {
    return <OnboardingSuccess user={me} recipient={recipients?.[0]} />;
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 56, maxWidth: 720 }}>
      <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0 }} aria-label="Setup progress">
        {['Profile', 'Care recipient', 'Done'].map((label, i) => (
          <li key={label} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: i <= stepIndex ? 600 : 400, color: i <= stepIndex ? 'var(--color-primary-dark)' : 'var(--color-muted)' }}>
            <span style={{ display: 'block', height: 4, borderRadius: 2, background: i <= stepIndex ? 'var(--color-primary)' : 'var(--color-border)', marginBottom: 6 }} />
            {label}
          </li>
        ))}
      </ol>

      {step === 'profile' && <ProfileStep me={me} onDone={() => load(false)} />}
      {step === 'recipient' && <RecipientStep onDone={() => load(true)} recipientCount={recipients?.length ?? 0} />}
    </div>
  );
}

function ProfileStep({ me, onDone }) {
  const { setUser } = useCustomerAuth();
  const [name, setName] = useState(me.full_name ?? '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateMe({ full_name: name.trim() });
      if (updated) {
        setUser(updated);
        try {
          sessionStorage.setItem('ay-user', JSON.stringify(updated));
          if (tokenStore.isRemembered && tokenStore.isRemembered()) {
            localStorage.setItem('ay-user', JSON.stringify(updated));
          }
        } catch {}
      }
      await onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginTop: 24 }}>
      <h2 style={{ marginTop: 0 }}>Your profile</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      <label style={{ display: 'grid', gap: 4, marginBottom: 16 }}>
        <span style={{ fontWeight: 600 }}>Full name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </label>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Continue'}</button>
    </form>
  );
}

export function RecipientForm({ initial, onSaved, onCancel }) {
  const [values, setValues] = useState({
    full_name: initial?.full_name ?? '',
    relationship: initial?.relationship ?? 'other',
    date_of_birth: initial?.date_of_birth ?? '',
    gender: initial?.gender ?? '',
    phone_e164: initial?.phone_e164 ?? '',
    notes: initial?.notes ?? '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      full_name: values.full_name.trim(),
      relationship: values.relationship,
      date_of_birth: values.date_of_birth || null,
      gender: values.gender || null,
      phone_e164: values.phone_e164.trim() || null,
      notes: values.notes,
    };
    try {
      if (initial?.id) await api.updateRecipient(initial.id, body);
      else await api.createRecipient(body);
      onSaved();
    } catch (err) {
      setError(err.fieldErrors ? Object.values(err.fieldErrors).join(' ') : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card">
      {error && <p className="form-error" role="alert">{error}</p>}
      <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>Full name</span>
        <input className="input" value={values.full_name} onChange={set('full_name')} required />
      </label>
      <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>Relationship</span>
        <select className="select" value={values.relationship} onChange={set('relationship')}>
          {['self', 'parent', 'spouse', 'child', 'sibling', 'relative', 'friend', 'other'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Date of birth</span>
          <input className="input" type="date" value={values.date_of_birth ?? ''} onChange={set('date_of_birth')} />
        </label>
        <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Gender</span>
          <select className="select" value={values.gender ?? ''} onChange={set('gender')}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <label style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>Phone (optional)</span>
        <input className="input" value={values.phone_e164 ?? ''} onChange={set('phone_e164')} placeholder="+919876543210" />
      </label>
      <label style={{ display: 'grid', gap: 4, marginBottom: 16 }}>
        <span style={{ fontWeight: 600 }}>Notes for the care team (optional)</span>
        <textarea className="textarea" rows={3} value={values.notes} onChange={set('notes')} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function RecipientStep({ onDone, recipientCount }) {
  const [showForm, setShowForm] = useState(recipientCount === 0);
  return (
    <div style={{ marginTop: 24 }}>
      <h2>Who needs support?</h2>
      <p className="muted">Add the person the hospital visit is for — yourself or someone you care for.</p>
      {showForm
        ? <RecipientForm onSaved={onDone} />
        : <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add person</button>}
    </div>
  );
}

import { CareRecipientsDirectory } from '../components/recipients/CareRecipientsDirectory.jsx';

export function RecipientsPage({ forceNew = false }) {
  useDocumentMeta('Care recipients', 'People you coordinate care for.');
  return <CareRecipientsDirectory forceNew={forceNew} />;
}


export { ProfilePage } from './ProfilePage.jsx';

