function Tooltip({ feature, position }) {
  if (!feature) {
    return null;
  }

  const { type, properties, issue } = feature;

  // Calculate tooltip position to stay within viewport
  const tooltipStyle = {
    left: position.x + 15,
    top: position.y + 15,
  };

  return (
    <div className="tooltip" style={tooltipStyle}>
      {type === 'boundary' && (
        <>
          <div className="tooltip-header">
            {properties.State_Name || properties.state || properties.name}
          </div>
          <div className="tooltip-content">
            {(properties.Dist_Name && properties.Dist_Name !== 'unknown_district') && (
              <div className="tooltip-row">
                <span className="tooltip-label">District</span>
                <span className="tooltip-value">{properties.Dist_Name}</span>
              </div>
            )}
            {properties.Dist_Code && (
              <div className="tooltip-row">
                <span className="tooltip-label">Code</span>
                <span className="tooltip-value">{properties.Dist_Code}</span>
              </div>
            )}
            {properties.degradation_level && (
              <div className="tooltip-row">
                <span className="tooltip-label">Soil Risk</span>
                <span className="tooltip-value">{String(properties.degradation_level).charAt(0).toUpperCase() + String(properties.degradation_level).slice(1)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {type === 'hotspot' && (
        <>
          <div className="tooltip-header">{properties.name}</div>
          <div className="tooltip-subheader">{properties.state}</div>
          <div className="tooltip-content">
            {issue === 'soil' && (
              <>
                <div className="tooltip-row">
                  <span className="tooltip-label">Soil Risk Score</span>
                  <span className="tooltip-value tooltip-highlight">
                    {(properties.soil_risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Risk Level</span>
                  <span className="tooltip-value">
                    {properties.soil_risk_score < 0.3
                      ? 'Low'
                      : properties.soil_risk_score < 0.6
                      ? 'Medium'
                      : 'High'}
                  </span>
                </div>
              </>
            )}
            {issue === 'yield' && (
              <>
                <div className="tooltip-row">
                  <span className="tooltip-label">Yield Trend</span>
                  <span className="tooltip-value tooltip-highlight">
                    {properties.yield_trend.charAt(0).toUpperCase() +
                      properties.yield_trend.slice(1)}
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Change</span>
                  <span className="tooltip-value">
                    {properties.yield_trend_pct > 0 ? '+' : ''}
                    {properties.yield_trend_pct}%
                  </span>
                </div>
              </>
            )}
            <div className="tooltip-row">
              <span className="tooltip-label">District ID</span>
              <span className="tooltip-value tooltip-mono">
                {properties.district_id}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Tooltip;
