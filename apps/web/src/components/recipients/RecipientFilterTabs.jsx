import React from 'react';

export function RecipientFilterTabs({
  activeFilter,
  onFilterChange,
  totalCount,
  activeCount,
  filteredCount,
  onSortToggle,
  isSortAsc,
}) {
  return (
    <div className="rc-filter-strip">
      <div className="rc-tab-group" role="tablist">
        <button
          type="button"
          className={`rc-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All Recipients ({totalCount})
        </button>

        <button
          type="button"
          className={`rc-tab-btn ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => onFilterChange('active')}
        >
          Active Coordination ({activeCount})
        </button>

        <button
          type="button"
          className={`rc-tab-btn ${activeFilter === 'archived' ? 'active' : ''}`}
          onClick={() => onFilterChange('archived')}
        >
          Archived (0)
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.25rem' }}>
        <span style={{ fontSize: '13px', color: '#4b6077' }}>
          Showing {filteredCount} of {totalCount} members
        </span>
        <button
          type="button"
          onClick={onSortToggle}
          title={isSortAsc ? 'Sort Descending' : 'Sort Ascending'}
          style={{
            padding: '0.5rem',
            borderRadius: '0.75rem',
            backgroundColor: '#ffffff',
            color: '#3f484a',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {isSortAsc ? 'arrow_upward' : 'sort'}
          </span>
        </button>
      </div>
    </div>
  );
}
