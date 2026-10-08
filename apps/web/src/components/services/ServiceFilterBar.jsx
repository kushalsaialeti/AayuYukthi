import { Icon } from '../public/Icon.jsx';

const CATEGORIES = [
  { key: 'all', label: 'All Services', icon: null },
  { key: 'outpatient', label: 'Outpatient & Doctor Visits', icon: 'stethoscope' },
  { key: 'logistics', label: 'Logistics & Transport', icon: 'airport_shuttle' },
  { key: 'administrative', label: 'Hospital & Administrative', icon: 'receipt_long' },
  { key: 'recurring', label: 'Chronic & Recurring Care', icon: 'elderly' },
];

export function ServiceFilterBar({
  activeCategory = 'all',
  onSelectCategory,
  categoryCounts = {},
  totalCount = 0,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
}) {
  return (
    <div className="svc-filter-container">
      {/* Category Pills */}
      <div className="svc-filter-bar" role="tablist" aria-label="Service categories">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          const count = cat.key === 'all' ? totalCount : (categoryCounts[cat.key] ?? 0);

          return (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`svc-filter-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.key)}
            >
              {cat.icon && <Icon name={cat.icon} fallback="medical_services" size={18} />}
              <span>{cat.label}</span>
              {count > 0 && <span className="svc-filter-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Optional Search Bar */}
      {onSearchChange && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (onSearchSubmit) onSearchSubmit(searchQuery);
          }}
          style={{ display: 'flex', gap: 8, marginTop: '1.25rem', maxWidth: 440 }}
        >
          <input
            className="svc-form-input"
            style={{ flex: 1, height: '2.5rem' }}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by treatment, visit type, or hospital needs…"
            aria-label="Search services"
          />
          <button
            className="svc-btn-request"
            style={{ padding: '0 1rem', height: '2.5rem' }}
            type="submit"
          >
            <Icon name="search" size={18} />
          </button>
        </form>
      )}
    </div>
  );
}
