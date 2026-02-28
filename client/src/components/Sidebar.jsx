import { ISSUE_TYPES } from '../constants/mapConfig';

const DISTRICTS = [
  { id: 'ahmednagar_mh', name: 'Ahmednagar', state: 'Maharashtra' },
  { id: 'yavatmal_mh', name: 'Yavatmal', state: 'Maharashtra' },
  { id: 'bathinda_pb', name: 'Bathinda', state: 'Punjab' },
  { id: 'mandya_ka', name: 'Mandya', state: 'Karnataka' },
];

function Sidebar({ selectedIssue, onIssueChange, selectedDistrict, onDistrictSelect }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Agri Intelligence</h1>
        <p className="sidebar-subtitle">Agricultural Insights for India</p>
      </div>

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
