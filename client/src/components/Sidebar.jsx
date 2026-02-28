import { useState, useMemo } from 'react';
import { ISSUE_TYPES } from '../constants/mapConfig';

const DISTRICTS = [
  { id: 'ahmednagar_mh', name: 'Ahmednagar', state: 'Maharashtra' },
  { id: 'yavatmal_mh', name: 'Yavatmal', state: 'Maharashtra' },
  { id: 'bathinda_pb', name: 'Bathinda', state: 'Punjab' },
  { id: 'mandya_ka', name: 'Mandya', state: 'Karnataka' },
];

function getDistrictLabel(feature) {
  const state = feature?.properties?.State_Name ?? feature?.properties?.state ?? '';
  const district = feature?.properties?.Dist_Name ?? feature?.properties?.district ?? '';
  if (district && district !== 'unknown_district') {
    return `${district}, ${state}`;
  }
  return state || 'Unknown';
}

function Sidebar({
  selectedIssue,
  onIssueChange,
  selectedDistrict,
  onDistrictSelect,
  districts = [],
  onDistrictSearchSelect,
  showAllColors = true,
  onShowAllColorsChange,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return districts.slice(0, 10);
    const q = searchQuery.trim().toLowerCase();
    return districts
      .filter((d) => {
        const label = getDistrictLabel(d.feature).toLowerCase();
        const state = (d.feature?.properties?.State_Name ?? '').toLowerCase();
        const district = (d.feature?.properties?.Dist_Name ?? '').toLowerCase();
        return label.includes(q) || state.includes(q) || district.includes(q);
      })
      .slice(0, 12);
  }, [districts, searchQuery]);

  const handleDistrictSearchClick = (d) => {
    onDistrictSearchSelect?.(d.feature);
    setSearchQuery(getDistrictLabel(d.feature));
    setIsSearchFocused(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredDistricts.length > 0) {
      handleDistrictSearchClick(filteredDistricts[0]);
    }
  };
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Agri Intelligence</h1>
        <p className="sidebar-subtitle">Agricultural Insights for India</p>
      </div>

      {onDistrictSearchSelect && districts.length > 0 && (
        <div className="sidebar-section sidebar-search">
          <h2 className="section-title">Search Districts</h2>
          <input
            type="text"
            className="search-input"
            placeholder="Search districts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            onKeyDown={handleSearchKeyDown}
          />
          {isSearchFocused && filteredDistricts.length > 0 && (
            <ul className="search-results">
              {filteredDistricts.map((d, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="search-result-item"
                    onMouseDown={() => handleDistrictSearchClick(d)}
                  >
                    {getDistrictLabel(d.feature)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onShowAllColorsChange && (
        <div className="sidebar-section">
          <h2 className="section-title">District Colors</h2>
          <label className="toggle-switch-row">
            <span className="toggle-label">Show all</span>
            <button
              type="button"
              role="switch"
              aria-checked={showAllColors}
              className={`toggle-switch ${showAllColors ? 'on' : ''}`}
              onClick={() => onShowAllColorsChange(!showAllColors)}
            >
              <span className="toggle-slider" />
            </button>
          </label>
          <p className="section-description">
            {showAllColors
              ? 'All districts colored by risk level'
              : 'Only hovered district shows risk color'}
          </p>
        </div>
      )}

      <div className="sidebar-section">
        <h2 className="section-title">Issue Layers</h2>
        <p className="section-description">
          Select an issue type to view hotspots on the map
        </p>

        <div className="toggle-buttons">
          <button
            className={`toggle-button ${selectedIssue === ISSUE_TYPES.SOIL ? 'active' : ''}`}
            onClick={() => onIssueChange(ISSUE_TYPES.SOIL)}
          >
            <span className="button-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c4-4 8-7.5 8-12a8 8 0 10-16 0c0 4.5 4 8 8 12z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span className="button-text">Soil Degradation</span>
          </button>

          <button
            className={`toggle-button ${selectedIssue === ISSUE_TYPES.YIELD ? 'active' : ''}`}
            onClick={() => onIssueChange(ISSUE_TYPES.YIELD)}
          >
            <span className="button-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-6 6" />
              </svg>
            </span>
            <span className="button-text">Yield Trend</span>
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h2 className="section-title">Districts</h2>
        <p className="section-description">
          4 districts under analysis
        </p>
        <ul className="district-list">
          {DISTRICTS.map((district) => (
            <li key={district.id}>
              <button
                type="button"
                className={`district-item ${selectedDistrict === district.id ? 'active' : ''}`}
                onClick={() => onDistrictSelect(district.id)}
              >
                <span className="district-name">{district.name}</span>
                <span className="district-state">{district.state}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <p className="footer-text">Iteration 1 - Map & Data Layer</p>
      </div>
    </div>
  );
}

export default Sidebar;
