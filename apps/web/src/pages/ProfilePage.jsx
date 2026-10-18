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

  useEffect(() => {
    let active = true;

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

  const handleSaveProfile = async (patchData) => {
    setBusy(true);
    setStatus(null);
    try {
      const updated = await api.updateMe(patchData);
      setUser(updated);
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
