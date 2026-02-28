import { ISSUE_TYPES } from '../constants/mapConfig';

function Legend({ selectedIssue }) {
  if (!selectedIssue) {
    return null;
  }

  const isSoil = selectedIssue === ISSUE_TYPES.SOIL;

  return (
    <div className="legend">
      <h3 className="legend-title">
        {isSoil ? 'Soil Degradation Risk' : 'Yield Trend'}
      </h3>

      <div className="legend-items">
        {isSoil ? (
          <>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgb(76, 175, 80)' }} />
              <span className="legend-label">Low Risk (&lt;30%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgb(255, 193, 7)' }} />
              <span className="legend-label">Medium Risk (30-60%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgb(244, 67, 54)' }} />
              <span className="legend-label">High Risk (&gt;60%)</span>
            </div>
          </>
        ) : (
          <>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgb(76, 175, 80)' }} />
              <span className="legend-label">Increasing</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgb(255, 193, 7)' }} />
              <span className="legend-label">Flat / Stable</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: 'rgb(244, 67, 54)' }} />
              <span className="legend-label">Decreasing</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Legend;
