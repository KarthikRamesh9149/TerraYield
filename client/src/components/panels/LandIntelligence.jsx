/**
 * LandIntelligence Panel (Feature 1)
 * Displays district health scores and AI-generated narrative
 */

import ScoreBar from '../ui/ScoreBar';

function LandIntelligence({ district, scores, narrative, narrativeLoading, onRefresh }) {
  if (!district) {
    return (
      <div className="panel-empty">
        <p>Select a district to view land intelligence data.</p>
      </div>
    );
  }

  const landIntel = district.feature_1_land_intelligence;

  return (
    <div className="land-intelligence-panel">
      {/* District Header */}
      <div className="panel-section">
        <div className="district-header">
          <h3 className="district-name">{district.name}</h3>
          <span className="district-state">{district.state}</span>
        </div>
        <div className="district-badge">
          <span className={`region-type ${district.region_type.replace('_', '-')}`}>
            {district.region_type.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Health Scores */}
      <div className="panel-section">
        <h4 className="section-title">Digital Twin Health Scores</h4>
        <div className="scores-grid">
          {scores && (
            <>
              <ScoreBar label="Soil Health" value={scores.soil?.value || 0} />
              <ScoreBar label="Water Stress" value={scores.water?.value || 0} />
              <ScoreBar label="Climate Risk" value={scores.climate?.value || 0} />
              <ScoreBar label="Crop Sustainability" value={scores.crop?.value || 0} />
              <div className="overall-score">
                <ScoreBar label="Overall Health" value={scores.overall?.value || 0} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="panel-section">
        <h4 className="section-title">Key Indicators</h4>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-icon">💧</span>
            <div className="metric-content">
              <span className="metric-value">{landIntel.water.years_until_bankruptcy}</span>
              <span className="metric-label">Years to Water Bankruptcy</span>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-icon">🌡️</span>
            <div className="metric-content">
              <span className="metric-value">{landIntel.climate.max_temp_c}°C</span>
              <span className="metric-label">Max Temperature</span>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-icon">🌧️</span>
            <div className="metric-content">
              <span className="metric-value">{landIntel.water.rainfall_mm_annual}mm</span>
              <span className="metric-label">Annual Rainfall</span>
            </div>
          </div>
          <div className="metric-item">
            <span className="metric-icon">🏜️</span>
            <div className="metric-content">
              <span className="metric-value">
                {landIntel.climate.drought_probability.replace('_', ' ')}
              </span>
              <span className="metric-label">Drought Probability</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Crop Status */}
      <div className="panel-section">
        <h4 className="section-title">Current Crop Profile</h4>
        <div className="current-crop">
          <div className="crop-info-row">
            <span className="label">Dominant Crop</span>
            <span className="value">{landIntel.current_status.dominant_crop}</span>
          </div>
          <div className="crop-info-row">
            <span className="label">Water Usage</span>
            <span className="value warning">
              {landIntel.current_status.current_crop_water_usage_liters_kg.toLocaleString()} L/kg
            </span>
          </div>
          <div className="crop-info-row">
            <span className="label">Land Degradation</span>
            <span className={`value ${landIntel.current_status.land_degradation_status}`}>
              {landIntel.current_status.land_degradation_status}
            </span>
          </div>
        </div>
      </div>

      {/* AI Narrative */}
      <div className="panel-section narrative-section">
        <div className="section-header">
          <h4 className="section-title">AI Analysis</h4>
          <button className="refresh-btn" onClick={onRefresh} disabled={narrativeLoading}>
            {narrativeLoading ? '...' : '↻'}
          </button>
        </div>
        <div className="narrative-content">
          {narrativeLoading ? (
            <div className="loading-text">Generating analysis...</div>
          ) : narrative ? (
            <p>{narrative}</p>
          ) : (
            <p className="placeholder-text">Click refresh to generate AI analysis</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LandIntelligence;
