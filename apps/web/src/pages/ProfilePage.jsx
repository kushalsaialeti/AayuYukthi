import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCustomerAuth } from '../auth.jsx';
import { useDocumentMeta } from '../components/layout.jsx';
import { api, tokenStore } from '../api.js';

import '../components/profile/profile.css';
import { ProfileHeaderCard } from '../components/profile/ProfileHeaderCard.jsx';
import { ProfileTabs } from '../components/profile/ProfileTabs.jsx';
import { ProfilePersonalInfoForm } from '../components/profile/ProfilePersonalInfoForm.jsx';
import { ProfileEmergencyContact } from '../components/profile/ProfileEmergencyContact.jsx';
import { ProfilePaymentBilling } from '../components/profile/ProfilePaymentBilling.jsx';
import { ProfilePrivacyGovernance } from '../components/profile/ProfilePrivacyGovernance.jsx';
import { ProfileRecipientsSidebar } from '../components/profile/ProfileRecipientsSidebar.jsx';
import { ProfileCoordinatorCard } from '../components/profile/ProfileCoordinatorCard.jsx';
import { ProfileTrustCharterCard } from '../components/profile/ProfileTrustCharterCard.jsx';

const PROFILE_CMS_KEYS = [
  'profile.header.badge',
  'profile.header.network',
  'profile.health.status',
  'profile.stats.punctuality',
  'profile.stats.billing',
  'profile.banner.policy',
  'profile.banner.policy_sub',
  'profile.emergency.notice',
  'profile.coordinator.name',
  'profile.coordinator.role',
  'profile.coordinator.rating',
  'profile.coordinator.bio',
  'profile.coordinator.phone',
  'profile.trust.title',
  'profile.trust.body',
  'profile.privacy.disclaimer',
];

export function ProfilePage() {
  const { user, setUser, logout } = useCustomerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  useDocumentMeta('Profile & Care Settings', 'Manage primary caregiver details, emergency contacts, payment rails, and healthcare data governance.');

  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab.toLowerCase();
    try {
      const cached = sessionStorage.getItem('ay_profile_tab');
      if (cached) return cached;
    } catch {}
    return 'personal';
  });
  const [recipients, setRecipients] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [cmsBlocks, setCmsBlocks] = useState({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;

    // Load CMS blocks
    api.blocks(PROFILE_CMS_KEYS)
      .then((data) => {
        if (!active) return;
        setCmsBlocks(data || {});
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

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    try {
      sessionStorage.setItem('ay_profile_tab', tabId);
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tabId);
        return n;
      }, { replace: true });
    } catch {}
    // Smoothly scroll to the corresponding section if on the page
    const targetMap = {
      personal: 'section-personal',
      notifications: 'section-personal',
      payment: 'section-payment',
      security: 'section-privacy',
      legal: 'section-privacy',
    };
    const targetEl = document.getElementById(targetMap[tabId]);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToPersonalForm = () => {
    setActiveTab('personal');
    const el = document.getElementById('section-personal');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="profile-page-shell">
      {/* Breadcrumb & Identification Bar */}
      <div>
        <nav aria-label="Breadcrumb" className="profile-breadcrumb-nav">
          <Link to="/app">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>space_dashboard</span>
            <span>Dashboard</span>
          </Link>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--cust-outline-variant)' }}>chevron_right</span>
          <span style={{ fontWeight: 600, color: 'var(--cust-on-surface)' }}>Profile & Care Settings</span>
        </nav>

        <div className="profile-header-title-row">
          <div>
            <h1 className="profile-header-title">Caregiver Profile & Family Account</h1>
            <p className="profile-header-subtitle">
              Manage primary contact details, notification preferences, verified payment methods, and non-clinical care authorizations.
            </p>
          </div>

          <div className="profile-header-actions">
            <button
              type="button"
              className="profile-btn-outline"
              onClick={scrollToPersonalForm}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_note</span>
              <span>Edit Profile Info</span>
            </button>

            <button
              type="button"
              className="profile-btn-danger"
              onClick={logout}
              title="Sign Out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Profile Header Card */}
      <ProfileHeaderCard
        user={user}
        recipientsCount={recipients.length}
        requestsCount={requestsCount}
        cmsBlocks={cmsBlocks}
        onSignOut={logout}
        onEditClick={scrollToPersonalForm}
      />

      {/* Tabbed Navigation */}
      <ProfileTabs
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
      />

      {/* Main Content Area: Split 8 / 4 Grid */}
      <div className="profile-layout-grid">
        {/* Primary Column (8 Cols) */}
        <div className="profile-column-primary">
          {/* Section 1: Primary Caregiver Identity Form */}
          <ProfilePersonalInfoForm
            user={user}
            onSave={handleSaveProfile}
            busy={busy}
            status={status}
          />

          {/* Section 2: Secondary / Emergency Care Contact */}
          <ProfileEmergencyContact
            contact={user?.preferences?.emergency_contact}
            cmsNotice={cmsBlocks['profile.emergency.notice']?.body_en}
            onUpdateContact={(ec) =>
              handleSaveProfile({
                preferences: { ...(user?.preferences || {}), emergency_contact: ec },
              })
            }
          />

          {/* Section 3: Saved Payment & Auto-Settlement Methods */}
          <ProfilePaymentBilling
            cmsPolicyTitle={cmsBlocks['profile.banner.policy']?.body_en}
            cmsPolicyDesc={cmsBlocks['profile.banner.policy_sub']?.body_en}
            savedMethods={user?.preferences?.payment_methods}
            gstin={user?.preferences?.gstin}
            invoicingEntity={user?.preferences?.invoicing_entity}
            onSaveBilling={(billing) =>
              handleSaveProfile({
                preferences: { ...(user?.preferences || {}), ...billing },
              })
            }
          />

          {/* Section 4: Privacy, Data Protection & DISHA Compliance */}
          <ProfilePrivacyGovernance
            privacySettings={user?.preferences?.privacy}
            onSavePrivacy={(priv) =>
              handleSaveProfile({
                preferences: { ...(user?.preferences || {}), privacy: priv },
              })
            }
          />
        </div>

        {/* Secondary Column (4 Cols): Side Summary & Caregiver Context */}
        <div className="profile-column-secondary">
          {/* Recipient Coverage Mini-Cards */}
          <ProfileRecipientsSidebar recipients={recipients} />

          {/* Designated Care Coordinator Concierge */}
          <ProfileCoordinatorCard cmsBlocks={cmsBlocks} />

          {/* Compliance & Legal Directives Card */}
          <ProfileTrustCharterCard cmsBlocks={cmsBlocks} />
        </div>
      </div>
    </div>
  );
}
