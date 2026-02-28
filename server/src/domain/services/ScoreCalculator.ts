/**
 * ScoreCalculator - Pure domain service for calculating health scores
 * No I/O, no external dependencies - pure business logic
 */

import type { Geography, Water, Climate, CurrentStatus } from '../entities/District.js';
import { HealthScore, DistrictScores } from '../value-objects/HealthScore.js';

export class ScoreCalculator {
  /**
   * Calculate soil health score based on geography data
   * Factors: pH balance, organic carbon, nitrogen levels
   */
  calculateSoilScore(geography: Geography): HealthScore {
    let score = 100;

    // pH scoring (optimal range 6.0-7.5)
    const ph = geography.soil_ph;
    if (ph < 5.5 || ph > 8.5) {
      score -= 30; // Extreme pH
    } else if (ph < 6.0 || ph > 8.0) {
      score -= 15; // Suboptimal pH
    }

    // Organic carbon scoring (optimal > 0.75%)
    const carbon = geography.organic_carbon_percent;
    if (carbon < 0.3) {
      score -= 35; // Very low
    } else if (carbon < 0.5) {
      score -= 20; // Low
    } else if (carbon < 0.75) {
      score -= 10; // Moderate
    }

    // Nitrogen scoring (optimal 250-300 kg/ha)
    const nitrogen = geography.nitrogen_kg_hectare;
    if (nitrogen < 150) {
      score -= 25; // Deficient
    } else if (nitrogen < 200) {
      score -= 15; // Low
    } else if (nitrogen < 250) {
      score -= 5; // Slightly low
    }

    // Texture consideration (clayey soils need more management)
    if (geography.texture.toLowerCase() === 'clayey') {
      score -= 5; // Slight penalty for management complexity
    }

    return HealthScore.create(score);
  }

  /**
   * Calculate water stress score based on water data
   * Factors: groundwater depth, extraction rate, rainfall, aquifer status
   */
  calculateWaterScore(water: Water): HealthScore {
    let score = 100;

    // Groundwater depth ratio to critical
    const depthRatio = water.groundwater_depth_m / water.critical_depth_m;
    if (depthRatio > 0.8) {
      score -= 40; // Near critical
    } else if (depthRatio > 0.6) {
      score -= 25; // Stressed
    } else if (depthRatio > 0.4) {
      score -= 10; // Moderate stress
    }

    // Years until bankruptcy
    if (water.years_until_bankruptcy < 5) {
      score -= 35; // Imminent crisis
    } else if (water.years_until_bankruptcy < 10) {
      score -= 20; // Serious concern
    } else if (water.years_until_bankruptcy < 15) {
      score -= 10; // Caution needed
    }

    // Rainfall scoring (optimal > 800mm)
    if (water.rainfall_mm_annual < 400) {
      score -= 20; // Very low
    } else if (water.rainfall_mm_annual < 600) {
      score -= 10; // Low
    }

    // Aquifer status
    const status = water.aquifer_status.toLowerCase();
    if (status === 'overexploited') {
      score -= 15;
    } else if (status === 'critical') {
      score -= 10;
    } else if (status === 'semi_critical') {
      score -= 5;
    }

    return HealthScore.create(score);
  }

  /**
   * Calculate climate resilience score
   * Factors: max temperature, heat stress days, drought probability
   */
  calculateClimateScore(climate: Climate): HealthScore {
    let score = 100;

    // Max temperature scoring
    if (climate.max_temp_c > 47) {
      score -= 30; // Extreme
    } else if (climate.max_temp_c > 45) {
      score -= 20; // Very high
    } else if (climate.max_temp_c > 42) {
      score -= 10; // High
    }

    // Heat stress days scoring
    if (climate.heat_stress_days_above_40c > 40) {
      score -= 30; // Severe
    } else if (climate.heat_stress_days_above_40c > 25) {
      score -= 20; // High
    } else if (climate.heat_stress_days_above_40c > 15) {
      score -= 10; // Moderate
    }

    // Drought probability
    const drought = climate.drought_probability.toLowerCase();
    if (drought === 'very_high') {
      score -= 25;
    } else if (drought === 'high') {
      score -= 15;
    } else if (drought === 'medium_high') {
      score -= 10;
    } else if (drought === 'medium') {
      score -= 5;
    }

    return HealthScore.create(score);
  }

  /**
   * Calculate current crop sustainability score
   * Factors: land degradation status, water usage efficiency
   */
  calculateCropScore(status: CurrentStatus): HealthScore {
    let score = 100;

    // Land degradation status
    const degradation = status.land_degradation_status.toLowerCase();
    if (degradation === 'severe') {
      score -= 40;
    } else if (degradation === 'moderate') {
      score -= 20;
    } else if (degradation === 'mild') {
      score -= 10;
    }

    // Water usage efficiency (lower is better, >15000 L/kg is high)
    const waterUsage = status.current_crop_water_usage_liters_kg;
    if (waterUsage > 30000) {
      score -= 30; // Very high water usage
    } else if (waterUsage > 20000) {
      score -= 20; // High
    } else if (waterUsage > 10000) {
      score -= 10; // Moderate
    }

    return HealthScore.create(score);
  }

  /**
   * Calculate overall health score as weighted average
   * Weights: Water (35%), Soil (25%), Climate (25%), Crop (15%)
   */
  calculateOverallHealth(scores: Omit<DistrictScores, 'overall'>): HealthScore {
    const weights = {
      water: 0.35,
      soil: 0.25,
      climate: 0.25,
      crop: 0.15,
    };

    const weightedSum =
      scores.soil.value * weights.soil +
      scores.water.value * weights.water +
      scores.climate.value * weights.climate +
      scores.crop.value * weights.crop;

    return HealthScore.create(weightedSum);
  }

  /**
   * Calculate all scores for a district
   */
  calculateAllScores(
    geography: Geography,
    water: Water,
    climate: Climate,
    currentStatus: CurrentStatus
  ): DistrictScores {
    const soil = this.calculateSoilScore(geography);
    const waterScore = this.calculateWaterScore(water);
    const climateScore = this.calculateClimateScore(climate);
    const crop = this.calculateCropScore(currentStatus);

    const overall = this.calculateOverallHealth({
      soil,
      water: waterScore,
      climate: climateScore,
      crop,
    });

    return {
      soil,
      water: waterScore,
      climate: climateScore,
      crop,
      overall,
    };
  }
}
