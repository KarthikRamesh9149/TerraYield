/**
 * RightPanel Component
 * Tabbed panel for Feature 1 (Land Intelligence), Feature 2 (Crop Matchmaker), and Feature 3 (Policy Simulator)
 */

import { useState } from 'react';
import { useDistrictData } from '../hooks/useDistrictData';
import LandIntelligence from './panels/LandIntelligence';
import CropMatchmaker from './panels/CropMatchmaker';
import PolicySimulator from './panels/PolicySimulator';

function RightPanel({ districtId, onClose }) {
  const [activeTab, setActiveTab] = useState('land');

  const {
    district,
    scores,
    narrative,
    narrativeLoading,
    cropRecommendations,
    cropWhyExplanation,
    cropWhyLoading,
    loading,
    error,
    refreshNarrative,
    refreshCropWhy,
  } = useDistrictData(districtId);

  if (!districtId) return null;

  return (
    <div className="right-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h2 className="panel-title">Digital Twin</h2>
        <button className="panel-close" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'land' ? 'active' : ''}`}
          onClick={() => setActiveTab('land')}
        >
          <span className="tab-icon">🌍</span>
          <span className="tab-label">Land Intel</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'crop' ? 'active' : ''}`}
          onClick={() => setActiveTab('crop')}
        >
          <span className="tab-icon">🌾</span>
          <span className="tab-label">Crop Match</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'policy' ? 'active' : ''}`}
          onClick={() => setActiveTab('policy')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">Policy Sim</span>
        </button>
      </div>

      {/* Panel Content */}
      <div className="panel-content">
        {loading && activeTab !== 'policy' ? (
          <div className="panel-loading">
            <div className="loading-spinner"></div>
            <p>Loading district data...</p>
          </div>
        ) : error && activeTab !== 'policy' ? (
          <div className="panel-error">
            <p>Error: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            {activeTab === 'land' && (
              <LandIntelligence
                district={district}
                scores={scores}
                narrative={narrative}
                narrativeLoading={narrativeLoading}
                onRefresh={refreshNarrative}
              />
            )}
            {activeTab === 'crop' && (
              <CropMatchmaker
                cropRecommendations={cropRecommendations}
                cropWhyExplanation={cropWhyExplanation}
                cropWhyLoading={cropWhyLoading}
                onRefreshWhy={refreshCropWhy}
              />
            )}
            {activeTab === 'policy' && (
              <PolicySimulator districtId={districtId} />
            )}
          </>
        )}
      </div>

      {/* Panel Footer */}
      <div className="panel-footer">
        <span className="iteration-badge">Iteration 4 - Policy Simulator</span>
      </div>
    </div>
  );
}

export default RightPanel;

