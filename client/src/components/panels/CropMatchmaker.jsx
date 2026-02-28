/**
 * CropMatchmaker Panel (Feature 2)
 * Displays top crop recommendations, companion planting, and economics
 */

import { useState } from 'react';
import CropCard from '../ui/CropCard';

function CropMatchmaker({
  cropRecommendations,
  cropWhyExplanation,
  cropWhyLoading,
  onRefreshWhy,
}) {
  const [expandedCrop, setExpandedCrop] = useState(null);

  if (!cropRecommendations) {
    return (
      <div className="panel-empty">
        <p>Loading crop recommendations...</p>
      </div>
    );
  }

  const { top_crops, companion_benefits, economic_comparison } = cropRecommendations;

  const handleCropToggle = (cropId) => {
    setExpandedCrop(expandedCrop === cropId ? null : cropId);
  };

  // Parse markdown-style explanation into bullet points
  const parseExplanation = (text) => {
    if (!text) return [];
    return text
      .split('\n')
      .filter((line) => line.trim().startsWith('•') || line.trim().startsWith('*'))
      .map((line) => line.replace(/^[•*]\s*\*?\*?/, '').replace(/\*?\*?$/, '').trim());
  };

  const explanationBullets = parseExplanation(cropWhyExplanation);

  return (
    <div className="crop-matchmaker-panel">
      {/* Top 3 Recommendations */}
      <div className="panel-section">
        <h4 className="section-title">Top Crop Recommendations</h4>
        <div className="crop-cards">
          {top_crops.map((crop, index) => (
            <CropCard
              key={crop.crop_id}
              crop={crop}
              rank={index + 1}
              isExpanded={expandedCrop === crop.crop_id}
              onToggle={() => handleCropToggle(crop.crop_id)}
            />
          ))}
        </div>
      </div>

      {/* Companion Planting */}
      {companion_benefits && companion_benefits.length > 0 && (
        <div className="panel-section">
          <h4 className="section-title">Companion Planting Benefits</h4>
          <div className="companion-cards">
            {companion_benefits.slice(0, 2).map((benefit) => (
              <div key={`${benefit.crop_id}-${benefit.companion_crop_id}`} className="companion-card">
                <div className="companion-pair">
                  <span className="primary-crop">{benefit.crop_id.replace('_', ' ')}</span>
                  <span className="pair-plus">+</span>
                  <span className="companion-crop">{benefit.companion_name}</span>
                </div>
                <div className="companion-ratio">
                  <span className="ratio-label">Ratio:</span>
                  <span className="ratio-value">{benefit.intercropping_ratio}</span>
                </div>
                <div className="companion-benefits">
                  <div className="benefit-item">
                    <span className="benefit-icon">🌱</span>
                    <span className="benefit-value">+{benefit.nitrogen_benefit_kg_ha} kg/ha</span>
                    <span className="benefit-label">Nitrogen</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">💰</span>
                    <span className="benefit-value">₹{benefit.cost_saved_inr_ha.toLocaleString()}</span>
                    <span className="benefit-label">Saved/ha</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Economic Comparison */}
      {economic_comparison && (
        <div className="panel-section">
          <h4 className="section-title">Economic X-Ray</h4>
          <div className="economic-table">
            <div className="table-header">
              <div className="col-label"></div>
              <div className="col-current">Current</div>
              <div className="col-recommended">Recommended</div>
            </div>
            <div className="table-row">
              <div className="col-label">Crop</div>
              <div className="col-current">{economic_comparison.current.crop}</div>
              <div className="col-recommended highlight">
                {economic_comparison.recommended.crop}
              </div>
            </div>
            <div className="table-row">
              <div className="col-label">Profit/ha</div>
              <div className="col-current">
                ₹{economic_comparison.current.profit_per_hectare_inr.toLocaleString()}
              </div>
              <div className="col-recommended highlight">
                ₹{economic_comparison.recommended.profit_per_hectare_inr.toLocaleString()}
              </div>
            </div>
            <div className="table-row">
              <div className="col-label">Water (L/kg)</div>
              <div className="col-current warning">
                {economic_comparison.current.water_liters_per_kg.toLocaleString()}
              </div>
              <div className="col-recommended good">
                {economic_comparison.recommended.water_liters_per_kg.toLocaleString()}
              </div>
            </div>
            <div className="table-row savings-row">
              <div className="col-label">Potential Savings</div>
              <div className="col-savings">
                <span className="saving-item">
                  +{economic_comparison.savings.income_increase_pct}% income
                </span>
                <span className="saving-item">
                  -{economic_comparison.savings.water_savings_pct}% water
                </span>
                <span className="saving-item">
                  ₹{economic_comparison.savings.fertilizer_savings_inr.toLocaleString()} fertilizer
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nitrogen Savings Calculator */}
      {companion_benefits && companion_benefits.length > 0 && (
        <div className="panel-section">
          <h4 className="section-title">Nitrogen Savings Calculator</h4>
          <div className="nitrogen-calculator">
            {companion_benefits.slice(0, 1).map((benefit) => (
              <div key={benefit.crop_id} className="nitrogen-card">
                <div className="nitrogen-header">
                  <span className="crop-name">
                    {benefit.crop_id.replace('_', ' ')} + {benefit.companion_name}
                  </span>
                </div>
                <div className="nitrogen-stats">
                  <div className="nitrogen-stat">
                    <span className="stat-value">{benefit.urea_equivalent_saved_kg}</span>
                    <span className="stat-label">kg urea saved/ha</span>
                  </div>
                  <div className="nitrogen-stat">
                    <span className="stat-value">₹{benefit.cost_saved_inr_ha.toLocaleString()}</span>
                    <span className="stat-label">fertilizer savings/ha</span>
                  </div>
                </div>
                <div className="nitrogen-note">
                  Through biological nitrogen fixation in the legume root nodules
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why This Fits - AI Explanation */}
      <div className="panel-section why-section">
        <div className="section-header">
          <h4 className="section-title">Why This Fits</h4>
          <button className="refresh-btn" onClick={onRefreshWhy} disabled={cropWhyLoading}>
            {cropWhyLoading ? '...' : '↻'}
          </button>
        </div>
        <div className="why-content">
          {cropWhyLoading ? (
            <div className="loading-text">Generating explanation...</div>
          ) : explanationBullets.length > 0 ? (
            <ul className="why-bullets">
              {explanationBullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          ) : cropWhyExplanation ? (
            <p className="why-text">{cropWhyExplanation}</p>
          ) : (
            <p className="placeholder-text">Click refresh to generate AI explanation</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CropMatchmaker;
