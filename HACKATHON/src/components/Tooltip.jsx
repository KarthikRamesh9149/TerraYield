export function Tooltip({ hovered, x, y }) {
  if (!hovered?.object?.properties) return null

  const p = hovered.object.properties

  // Region/district: State_Name, Dist_Name
  const stateName = p.State_Name || p.state
  const distName = p.Dist_Name || p.district

  // Hotspot: name, soil_risk_score, yield_trend
  const hotspotName = p.name

  const isBoundary = stateName != null || distName != null

  return (
    <div
      className="tooltip"
      style={{
        left: x,
        top: y,
        transform: 'translate(10px, 10px)'
      }}
    >
      {isBoundary && (
        <>
          {stateName && <div className="tooltip-title">{stateName}</div>}
          {distName && distName !== 'unknown_district' && (
            <div className="tooltip-row">District: <strong>{distName}</strong></div>
          )}
        </>
      )}
      {!isBoundary && hotspotName && (
        <div className="tooltip-title">{hotspotName}</div>
      )}
      {p.soil_risk_score != null && (
        <div className="tooltip-row">
          Soil risk: <strong>{(p.soil_risk_score * 100).toFixed(0)}%</strong>
        </div>
      )}
      {p.yield_trend != null && (
        <div className="tooltip-row">
          Yield trend: <strong>{p.yield_trend}</strong>
          {p.yield_trend_pct != null && (
            <span> ({p.yield_trend_pct > 0 ? '+' : ''}{p.yield_trend_pct}%/yr)</span>
          )}
        </div>
      )}
    </div>
  )
}
