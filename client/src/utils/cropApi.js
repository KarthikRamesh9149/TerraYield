/**
 * Crop API utilities
 * Handles fetching crop recommendations and LLM explanations
 */

// Toggle between real API and local data
const USE_REAL_API = false;

/**
 * Fetch crop recommendations for a district
 * @param {string} districtId - The district ID
 * @returns {Promise<Object>} Crop recommendations response
 */
export async function fetchCropRecommendations(districtId) {
  if (USE_REAL_API) {
    const response = await fetch(`/api/crops/recommendations/${districtId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch crop recommendations: ${response.status}`);
    }
    return response.json();
  }

  // Stub: Load district data and generate mock recommendations
  return generateStubRecommendations(districtId);
}

/**
 * Fetch "Why this fits" explanation from Mistral
 * @param {string} districtId - The district ID
 * @returns {Promise<Object>} LLM explanation response
 */
export async function fetchCropWhyExplanation(districtId) {
  if (USE_REAL_API) {
    const response = await fetch('/api/llm/feature2-why', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district_id: districtId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch crop explanation: ${response.status}`);
    }
    return response.json();
  }

  // Stub: Generate fallback explanation
  return generateStubExplanation(districtId);
}

/**
 * Fetch district data with scores
 * @param {string} districtId - The district ID
 * @returns {Promise<Object>} District with scores
 */
export async function fetchDistrictWithScores(districtId) {
  if (USE_REAL_API) {
    const response = await fetch(`/api/districts/${districtId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch district: ${response.status}`);
    }
    return response.json();
  }

  // Stub: Load from public folder
  const response = await fetch(`/districts/${districtId}.json`);
  if (!response.ok) {
    throw new Error(`District not found: ${districtId}`);
  }
  const district = await response.json();

  // Calculate mock scores
  const scores = calculateMockScores(district);

  return {
    ...district,
    scores,
  };
}

/**
 * Fetch narrative for Feature 1
 * @param {string} districtId - The district ID
 * @returns {Promise<Object>} Narrative response
 */
export async function fetchNarrative(districtId) {
  if (USE_REAL_API) {
    const response = await fetch('/api/llm/feature1-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district_id: districtId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch narrative: ${response.status}`);
    }
    return response.json();
  }

  // Stub: Generate fallback narrative
  const district = await fetchDistrictWithScores(districtId);
  return generateStubNarrative(district);
}

// Stub helpers

function calculateMockScores(district) {
  const landIntel = district.feature_1_land_intelligence;

  // Simplified score calculation (matches server ScoreCalculator logic)
  let soilScore = 100;
  const ph = landIntel.geography.soil_ph;
  if (ph < 5.5 || ph > 8.5) soilScore -= 30;
  else if (ph < 6.0 || ph > 8.0) soilScore -= 15;
  const carbon = landIntel.geography.organic_carbon_percent;
  if (carbon < 0.3) soilScore -= 35;
  else if (carbon < 0.5) soilScore -= 20;
  else if (carbon < 0.75) soilScore -= 10;

  let waterScore = 100;
  const depthRatio = landIntel.water.groundwater_depth_m / landIntel.water.critical_depth_m;
  if (depthRatio > 0.8) waterScore -= 40;
  else if (depthRatio > 0.6) waterScore -= 25;
  if (landIntel.water.years_until_bankruptcy < 5) waterScore -= 35;
  else if (landIntel.water.years_until_bankruptcy < 10) waterScore -= 20;
  if (landIntel.water.aquifer_status === 'overexploited') waterScore -= 15;

  let climateScore = 100;
  if (landIntel.climate.max_temp_c > 45) climateScore -= 20;
  else if (landIntel.climate.max_temp_c > 42) climateScore -= 10;
  if (landIntel.climate.heat_stress_days_above_40c > 40) climateScore -= 30;
  else if (landIntel.climate.heat_stress_days_above_40c > 25) climateScore -= 20;
  const drought = landIntel.climate.drought_probability.toLowerCase();
  if (drought === 'very_high') climateScore -= 25;
  else if (drought === 'high') climateScore -= 15;

  let cropScore = 100;
  const degradation = landIntel.current_status.land_degradation_status.toLowerCase();
  if (degradation === 'severe') cropScore -= 40;
  else if (degradation === 'moderate') cropScore -= 20;
  const waterUsage = landIntel.current_status.current_crop_water_usage_liters_kg;
  if (waterUsage > 30000) cropScore -= 30;
  else if (waterUsage > 20000) cropScore -= 20;
  else if (waterUsage > 10000) cropScore -= 10;

  const overall = Math.round(
    soilScore * 0.25 + waterScore * 0.35 + climateScore * 0.25 + cropScore * 0.15
  );

  return {
    soil: { value: Math.max(0, soilScore) },
    water: { value: Math.max(0, waterScore) },
    climate: { value: Math.max(0, climateScore) },
    crop: { value: Math.max(0, cropScore) },
    overall: { value: Math.max(0, overall) },
  };
}

async function generateStubRecommendations(districtId) {
  // Load crops database
  const cropsResponse = await fetch('/data/crops_database.json');
  const crops = await cropsResponse.json();

  // Load district
  const districtResponse = await fetch(`/districts/${districtId}.json`);
  const district = await districtResponse.json();

  const landIntel = district.feature_1_land_intelligence;

  // Simple filtering
  const filteredCrops = crops.filter((crop) => {
    if (crop.agronomy.temp_max_survival_c < landIntel.climate.max_temp_c) return false;
    if (
      landIntel.geography.soil_ph < crop.agronomy.ph_min ||
      landIntel.geography.soil_ph > crop.agronomy.ph_max
    )
      return false;
    if (landIntel.water.years_until_bankruptcy < 10 && crop.agronomy.water_liters_per_kg > 3000)
      return false;
    return true;
  });

  // Simple scoring
  const scoredCrops = filteredCrops.map((crop) => {
    const waterScore = Math.max(0, (22000 - crop.agronomy.water_liters_per_kg) / 21000) * 40;
    const profitScore = (crop.economics.profit_band / 5) * 30;
    const droughtScore = crop.agronomy.drought_tolerance * 10;
    const soilScore = crop.agronomy.nitrogen_fixation ? 20 : 15;

    return {
      ...crop,
      match_score: Math.round(waterScore + profitScore + droughtScore + soilScore),
      score_breakdown: {
        water_efficiency: Math.round(waterScore),
        profit: Math.round(profitScore),
        soil_match: Math.round(soilScore),
        drought: Math.round(droughtScore),
      },
    };
  });

  // Sort and take top 3
  scoredCrops.sort((a, b) => b.match_score - a.match_score);
  const topCrops = scoredCrops.slice(0, 3);

  // Load companion rules
  const rulesResponse = await fetch('/data/companion_rules.json');
  const companionRules = await rulesResponse.json();

  // Build companion benefits
  const companionBenefits = topCrops
    .map((crop) => {
      const companionId = crop.companion.best_companion_crop_id;
      const rule = companionRules.find(
        (r) =>
          (r.crop_id === crop.crop_id && r.companion_crop_id === companionId) ||
          (r.crop_id === companionId && r.companion_crop_id === crop.crop_id)
      );
      const companionCrop = crops.find((c) => c.crop_id === companionId);

      if (rule && companionCrop) {
        return {
          crop_id: crop.crop_id,
          companion_crop_id: companionId,
          companion_name: companionCrop.name,
          intercropping_ratio: crop.companion.intercropping_ratio,
          nitrogen_benefit_kg_ha: rule.nitrogen_benefit_kg_ha,
          urea_equivalent_saved_kg: rule.urea_equivalent_saved_kg,
          cost_saved_inr_ha: rule.cost_saved_inr_ha,
        };
      }
      return null;
    })
    .filter(Boolean);

  const cropEcon = district.feature_2_crop_economics;
  const economicComparison = {
    current: {
      crop: cropEcon.current_crop_profile.crop,
      profit_per_hectare_inr: cropEcon.current_crop_profile.profit_per_hectare_inr,
      water_liters_per_kg: cropEcon.current_crop_profile.water_requirement_liters_kg,
      fertilizer_cost_inr: cropEcon.current_crop_profile.input_cost_fertilizer_inr_hectare,
    },
    recommended: {
      crop: topCrops[0]?.name || 'N/A',
      profit_per_hectare_inr: cropEcon.recommended_alternative.profit_per_hectare_inr,
      water_liters_per_kg: topCrops[0]?.agronomy.water_liters_per_kg || 0,
      fertilizer_cost_inr: cropEcon.recommended_alternative.input_cost_fertilizer_inr_hectare,
    },
    savings: {
      income_increase_pct: cropEcon.economic_arbitrage.income_increase_pct,
      water_savings_pct: cropEcon.economic_arbitrage.water_savings_pct,
      fertilizer_savings_inr: cropEcon.economic_arbitrage.fertilizer_savings_inr_hectare,
    },
  };

  return {
    district_id: districtId,
    district_name: district.name,
    top_crops: topCrops,
    companion_benefits: companionBenefits,
    economic_comparison: economicComparison,
    generated_at: new Date().toISOString(),
  };
}

function generateStubExplanation(districtId) {
  return {
    district_id: districtId,
    why_explanation: `Based on local conditions, here's why our top recommendation fits:

• **Water Efficiency**: Uses significantly less water than current crop, critical for sustainable farming in water-stressed regions.

• **Climate Resilience**: Drought-tolerant variety that can withstand high temperatures and erratic rainfall patterns.

• **Economic Benefits**: Higher profit margins due to strong MSP support and rising market demand for pulses.

• **Soil Health**: Nitrogen-fixing properties help restore soil fertility, reducing fertilizer dependency.

• **Risk Mitigation**: Government price support (MSP) provides income security against market fluctuations.`,
    generated_at: new Date().toISOString(),
  };
}

function generateStubNarrative(district) {
  const landIntel = district.feature_1_land_intelligence;
  const scores = district.scores;

  return {
    district_id: district.district_id,
    narrative: `${district.name} faces ${landIntel.water.aquifer_status} groundwater conditions with only ${landIntel.water.years_until_bankruptcy} years until depletion at current extraction rates. The ${landIntel.current_status.land_degradation_status} land degradation and ${landIntel.climate.drought_probability.replace('_', ' ')} drought probability signal urgent need for crop transition. Current ${landIntel.current_status.dominant_crop} cultivation requires ${landIntel.current_status.current_crop_water_usage_liters_kg.toLocaleString()} L/kg water—unsustainable given declining rainfall of ${landIntel.water.rainfall_mm_annual}mm annually.`,
    scores,
    generated_at: new Date().toISOString(),
  };
}
