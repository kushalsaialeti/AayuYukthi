import React from 'react';

const TABS = [
  { id: 'personal', label: 'Personal Information', icon: 'badge' },
  { id: 'notifications', label: 'Family Broadcast & Notifications', icon: 'cell_tower' },
  { id: 'payment', label: 'Payment & Billing Methods', icon: 'credit_card' },
  { id: 'security', label: 'Security & Passcode', icon: 'encrypted' },
  { id: 'legal', label: 'Legal & Directives', icon: 'policy' },
];

export function ProfileTabs({ activeTab, onSelectTab }) {
  return (
    <div className="profile-tabs-scroller" role="tablist">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`profile-tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
