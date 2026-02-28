/**
 * ScoreBar Component
 * Displays a health/match score as a progress bar with color coding
 */

function ScoreBar({ label, value, maxValue = 100, showValue = true, size = 'default' }) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  // Determine color based on score
  const getColor = () => {
    if (percentage >= 70) return 'var(--accent-green)';
    if (percentage >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const getLevel = () => {
    if (percentage >= 70) return 'Good';
    if (percentage >= 40) return 'Warning';
    return 'Critical';
  };

  const barHeight = size === 'small' ? '6px' : '8px';

  return (
    <div className="score-bar">
      <div className="score-bar-header">
        <span className="score-bar-label">{label}</span>
        {showValue && (
          <span className="score-bar-value" style={{ color: getColor() }}>
            {Math.round(value)} <span className="score-bar-level">({getLevel()})</span>
          </span>
        )}
      </div>
      <div className="score-bar-track" style={{ height: barHeight }}>
        <div
          className="score-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
            height: barHeight,
          }}
        />
      </div>
    </div>
  );
}

export default ScoreBar;
