import { Icon } from '../public/Icon.jsx';

export function HospitalFilterHub({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCityChange,
  selectedSpecialty,
  onSpecialtyChange,
  onApplyFilters,
  cityList = [],
  cityCounts = {},
  totalCount = 0,
  showingCount = 0,
  viewMode = 'grid',
  onViewModeChange,
}) {
  return (
    <section className="hsp-filter-section">
      <div className="pub-container">
        <div className="hsp-filter-box">
          {/* Main Search & Select Row */}
          <form
            className="hsp-filter-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (onApplyFilters) onApplyFilters();
            }}
          >
            {/* Search Input */}
            <div className="hsp-input-wrap">
              <Icon name="search" size={22} className="hsp-input-icon" />
              <input
                className="hsp-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search hospital name or locality (e.g. Varma Hospitals, Bhimavaram)..."
                aria-label="Search hospitals"
              />
            </div>

            {/* City Selector */}
            <div className="hsp-input-wrap">
              <Icon name="location_city" size={20} className="hsp-input-icon" />
              <select
                className="hsp-select"
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                aria-label="Filter by city"
              >
                <option value="all">All Metro Cities</option>
                {cityList.map((c) => (
                  <option key={c} value={c}>
                    {c} {cityCounts[c] ? `(${cityCounts[c]} Hubs)` : ''}
                  </option>
                ))}
              </select>
              <Icon name="arrow_drop_down" size={20} className="hsp-input-chevron" />
            </div>

            {/* Specialty / Wing Selector */}
            <div className="hsp-input-wrap">
              <Icon name="medical_services" size={20} className="hsp-input-icon" />
              <select
                className="hsp-select"
                value={selectedSpecialty}
                onChange={(e) => onSpecialtyChange(e.target.value)}
                aria-label="Filter by specialty"
              >
                <option value="all">All Specialties</option>
                <option value="oncology">Oncology Wing</option>
                <option value="cardiology">Cardiology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="nephrology">Nephrology & Dialysis</option>
                <option value="general">General & Day-Care</option>
              </select>
              <Icon name="arrow_drop_down" size={20} className="hsp-input-chevron" />
            </div>

            {/* Apply Button */}
            <div>
              <button type="submit" className="hsp-btn-apply">
                <Icon name="tune" size={18} />
                <span>Apply Filter</span>
              </button>
            </div>
          </form>

          {/* Quick Filters & View State Meta Bar */}
          <div className="hsp-meta-bar">
            {/* City Quick Pills */}
            <div className="hsp-quick-pills" role="tablist" aria-label="City quick filters">
              <button
                type="button"
                className={`hsp-pill-btn ${selectedCity === 'all' ? 'active' : ''}`}
                onClick={() => onCityChange('all')}
              >
                All ({totalCount})
              </button>
              {cityList.map((c) => {
                const count = cityCounts[c] ?? 0;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`hsp-pill-btn ${selectedCity === c ? 'active' : ''}`}
                    onClick={() => onCityChange(c)}
                  >
                    {c} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Counter & Grid/List Switch */}
            <div className="hsp-counter-views">
              <span className="hsp-counter-text">
                Showing <strong>{showingCount}</strong> of {totalCount} partner facilities
              </span>
              <div className="hsp-view-toggle">
                <button
                  type="button"
                  className={`hsp-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => onViewModeChange('grid')}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <Icon name="grid_view" size={18} />
                </button>
                <button
                  type="button"
                  className={`hsp-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => onViewModeChange('list')}
                  title="List View"
                  aria-label="List View"
                >
                  <Icon name="view_list" size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
