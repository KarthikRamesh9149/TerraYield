const ISSUES = [
  { id: 'soil', label: 'Soil degradation risk' },
  { id: 'yield', label: 'Yield trend (plateauing/decreasing)' }
]

export function Sidebar({ selectedIssue, onSelectIssue }) {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Map filters</h2>
      <p className="sidebar-hint">Select one layer to display</p>
      <div className="filter-toggles">
        {ISSUES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`filter-toggle${selectedIssue === id ? ' filter-toggle--active' : ''}`}
            onClick={() => onSelectIssue(selectedIssue === id ? null : id)}
          >
            <span className="filter-toggle__indicator" />
            {label}
          </button>
        ))}
      </div>
    </aside>
  )
}
