import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../auth.jsx';
import { useDocumentMeta } from '../components/layout.jsx';
import { api, tokenStore } from '../api.js';

import '../components/profile/profile.css';
import { ProfileHeaderCard } from '../components/profile/ProfileHeaderCard.jsx';
import { ProfilePersonalInfoForm } from '../components/profile/ProfilePersonalInfoForm.jsx';
import { ProfileEmergencyContact } from '../components/profile/ProfileEmergencyContact.jsx';
import { ProfileRecipientsSidebar } from '../components/profile/ProfileRecipientsSidebar.jsx';

export function ProfilePage() {
  const { user, setUser, logout } = useCustomerAuth();
  useDocumentMeta('Profile', 'Manage your personal details and emergency contacts.');

  const [recipients, setRecipients] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [publicId, setPublicId] = useState(user?.public_id || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    // Fresh account payload — guarantees a current portal-wide public_id even
    // when the cached localStorage user was written before the field existed.
    api.me()
      .then((me) => {
        if (!active || !me) return;
        setUser(me);
        setPublicId(me.public_id || '');
        try {
          sessionStorage.setItem('ay-user', JSON.stringify(me));
          if (tokenStore.isRemembered && tokenStore.isRemembered()) {
            localStorage.setItem('ay-user', JSON.stringify(me));
          }
        } catch {
          /* storage in private browsing */
        }
      })
      .catch(() => {});

    // Load active care recipients
    api.recipients({ limit: 10 })
      .then((res) => {
        if (!active) return;
        const list = res?.data || res?.items || [];
        setRecipients(list);
      })
      .catch(() => {});

    // Load requests count
    api.authedList({ limit: 50 })
      .then((res) => {
        if (!active) return;
        const total = res?.total ?? (res?.data || []).length;
        setRequestsCount(total);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Pick up public_id if it arrives via the auth context after mount.
  useEffect(() => {
    if (!publicId && user?.public_id) setPublicId(user.public_id);
  }, [user, publicId]);

  const handleSaveProfile = async (patchData) => {
    setBusy(true);
    setStatus(null);
    try {
      const updated = await api.updateMe(patchData);
      setUser(updated);
      if (updated?.public_id) setPublicId(updated.public_id);
      try {
        sessionStorage.setItem('ay-user', JSON.stringify(updated));
        if (tokenStore.isRemembered && tokenStore.isRemembered()) {
          localStorage.setItem('ay-user', JSON.stringify(updated));
        }
      } catch {
        /* storage in private browsing */
      }
      setStatus('saved');
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setStatus(err.message || 'Failed to update profile');
    } finally {
      setBusy(false);
    }
  };

  const scrollToPersonalForm = () => {
    const el = document.getElementById('section-personal');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const copyPublicId = async () => {
    if (!publicId) return;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicId);
        done();
        return;
      }
      throw new Error('clipboard unavailable');
    } catch {
      // Fallback for browsers/contexts without the async clipboard API
      try {
        const ta = document.createElement('textarea');
        ta.value = publicId;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) done();
      } catch {
        /* copy not permitted — the ID stays visible on screen */
      }
    }
  };

  return (
    <div className="profile-page-shell">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="profile-breadcrumb-nav">
        <Link to="/app">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>space_dashboard</span>
          <span>Dashboard</span>
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-outline-variant)' }}>chevron_right</span>
        <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>Profile</span>
      </nav>

      {/* Page Title */}
      <div className="profile-header-title-row">
        <div>
          <h1 className="profile-header-title">My Profile</h1>
          <p className="profile-header-subtitle">
            Manage your personal details and emergency contacts.
          </p>
        </div>
      </div>

      {/* Portal-wide unique account ID */}
      {publicId && (
        <div className="cust-id-block">
          <div className="cust-id-block-text">
            <span className="cust-id-label">Your AayuYukthi ID</span>
            <span className="cust-id-value">{publicId}</span>
            <p className="cust-id-help">
              This unique ID identifies you across every request, recipient, and support thread in
              your portal. Quote it when you contact us.
            </p>
          </div>
          <button
            type="button"
            className="cust-id-copy"
            onClick={copyPublicId}
            aria-label={`Copy your AayuYukthi ID ${publicId}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy ID'}</span>
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <ProfileHeaderCard
        user={user}
        recipientsCount={recipients.length}
        requestsCount={requestsCount}
        cmsBlocks={{}}
        onSignOut={logout}
        onEditClick={scrollToPersonalForm}
      />

      {/* Main Content: 2 Column Layout */}
      <div className="profile-layout-grid">
        {/* Primary Column */}
        <div className="profile-column-primary">
          {/* Personal Info Form */}
          <ProfilePersonalInfoForm
            user={user}
            onSave={handleSaveProfile}
            busy={busy}
            status={status}
          />

          {/* Emergency Contact */}
          <ProfileEmergencyContact
            contact={user?.preferences?.emergency_contact}
            onUpdateContact={(ec) =>
              handleSaveProfile({
                preferences: { ...(user?.preferences || {}), emergency_contact: ec },
              })
            }
          />
        </div>

        {/* Secondary Column */}
        <div className="profile-column-secondary">
          <ProfileRecipientsSidebar recipients={recipients} />
        </div>
      </div>
    </div>
  );
}
