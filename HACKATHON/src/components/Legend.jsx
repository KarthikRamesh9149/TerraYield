export function Legend({ issue }) {
  if (!issue) {
    return (
      <div className="legend">
        <p className="legend-empty">Select a filter to see legend</p>
      </div>
    )
  }

  if (issue === 'soil') {
    return (
      <div className="legend">
        <h3 className="legend-title">Soil degradation risk</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(0, 128, 0, 0.3)' }} />
            <span>Low (0–0.33)</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(255, 255, 0, 0.5)' }} />
            <span>Medium (0.34–0.66)</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(255, 0, 0, 0.7)' }} />
            <span>High (0.67–1)</span>
          </div>
        </div>
      </div>
    )
  }

  if (issue === 'yield') {
    return (
      <div className="legend">
        <h3 className="legend-title">Yield trend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(255, 0, 0, 0.7)' }} />
            <span>Decreasing</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(255, 255, 0, 0.6)' }} />
            <span>Flat / Plateauing</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(0, 128, 0, 0.6)' }} />
            <span>Increasing</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}
