import React from 'react';

export function CustomerRequestFilters({
  counts = {},
  selectedTab = 'ALL',
  onTabChange,
  viewMode = 'list',
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
  recipients = [],
  selectedRecipient = '',
  onRecipientChange,
  hospitals = [],
  selectedHospital = '',
  onHospitalChange,
  selectedPeriod = 'ALL',
  onPeriodChange,
}) {
  const tabs = [
    { key: 'ALL', label: 'All Requests', count: counts.all ?? 0 },
    { key: 'ACTIVE', label: 'Upcoming & Active', count: counts.active ?? 0, badge: true },
    { key: 'COMPLETED', label: 'Completed', count: counts.completed ?? 0 },
    { key: 'REVIEW', label: 'Drafts / In Review', count: counts.review ?? 0 },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      backgroundColor: 'var(--cust-surface-container-lowest)',
      padding: '1rem 1.25rem',
      borderRadius: '1rem',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(0, 0, 0, 0.03)'
    }}>
      {/* Top Row: Tabs + View Switcher */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {tabs.map((t) => {
            const isActive = selectedTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onTabChange(t.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? 'var(--cust-primary-container)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--cust-on-surface-variant)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{t.label}</span>
                {t.badge && t.count > 0 ? (
                  <span style={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--cust-secondary-fixed)',
                    color: isActive ? '#ffffff' : 'var(--cust-on-secondary-fixed)',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px'
                  }}>
                    {t.count}
                  </span>
                ) : (
                  <span style={{ opacity: isActive ? 0.85 : 0.65, fontSize: '0.75rem' }}>
                    ({t.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          backgroundColor: 'var(--cust-surface-container-low)',
          padding: '0.25rem',
          borderRadius: '0.75rem'
        }}>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="List View"
            style={{
              padding: '0.375rem 0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: viewMode === 'list' ? 'var(--cust-surface-container-lowest)' : 'transparent',
              color: viewMode === 'list' ? 'var(--cust-primary)' : 'var(--cust-secondary)',
              border: 'none',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>view_list</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            style={{
              padding: '0.375rem 0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: viewMode === 'grid' ? 'var(--cust-surface-container-lowest)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--cust-primary)' : 'var(--cust-secondary)',
              border: 'none',
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>grid_view</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Search Field + Dropdowns */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        paddingTop: '0.25rem'
      }}>
        {/* Search Field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--cust-surface-container-low)',
          padding: '0.5rem 0.875rem',
          borderRadius: '0.75rem',
          flex: '1 1 280px',
          maxWidth: '420px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--cust-secondary)' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search by Ref ID, hospital, recipient, or companion name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.8125rem',
              color: 'var(--cust-on-surface)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--cust-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          {/* Recipient Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--cust-surface-container-low)',
            borderRadius: '0.75rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--cust-on-surface-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-secondary)', marginRight: '0.35rem' }}>
              person
            </span>
            <span style={{ color: 'var(--cust-secondary)', marginRight: '0.35rem' }}>Recipient:</span>
            <select
              value={selectedRecipient}
              onChange={(e) => onRecipientChange(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontWeight: 600,
                color: 'var(--cust-on-surface)',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              <option value="">All ({recipients.length} Recipients)</option>
              {recipients.map((rec) => (
                <option key={rec.id} value={rec.full_name}>
                  {rec.full_name} {rec.relationship ? `(${rec.relationship})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--cust-surface-container-low)',
            borderRadius: '0.75rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--cust-on-surface-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-secondary)', marginRight: '0.35rem' }}>
              local_hospital
            </span>
            <span style={{ color: 'var(--cust-secondary)', marginRight: '0.35rem' }}>Hospital:</span>
            <select
              value={selectedHospital}
              onChange={(e) => onHospitalChange(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontWeight: 600,
                color: 'var(--cust-on-surface)',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              <option value="">All Facilities</option>
              {hospitals.map((hosp, i) => (
                <option key={i} value={hosp}>
                  {hosp}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--cust-surface-container-low)',
            borderRadius: '0.75rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--cust-on-surface-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--cust-secondary)', marginRight: '0.35rem' }}>
              calendar_today
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontWeight: 600,
                color: 'var(--cust-on-surface)',
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              <option value="ALL">All Time</option>
              <option value="30D">Last 30 Days</option>
              <option value="6M">Last 6 Months</option>
              <option value="2024">Year 2024</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
