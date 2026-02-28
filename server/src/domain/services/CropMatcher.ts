/**
 * CropMatcher - Pure domain service for crop recommendation
 * Filters, scores, and ranks crops based on district conditions
 * No I/O, no external dependencies - pure business logic
 */

export interface CropAgronomy {
  ph_min: number;
  ph_max: number;
  temp_max_survival_c: number;
  water_need_mm: number;
  drought_tolerance: number;
  nitrogen_fixation: boolean;
  water_liters_per_kg: number;
}

export interface CropEconomics {
  profit_band: number; // 1-5
  msp_inr_quintal: number | null;
}

export interface CropCompanion {
  best_companion_crop_id: string;
  intercropping_ratio: string;
}

export interface Crop {
  crop_id: string;
  name: string;
  local_name: string;
  agronomy: CropAgronomy;
  economics: CropEconomics;
  companion: CropCompanion;
}

export interface CompanionRule {
  crop_id: string;
  companion_crop_id: string;
  nitrogen_benefit_kg_ha: number;
  urea_equivalent_saved_kg: number;
  cost_saved_inr_ha: number;
}

export interface DistrictContext {
  district_id: string;
  soil_ph: number;
  max_temp_c: number;
  years_until_bankruptcy: number;
  rainfall_mm_annual: number;
  drought_probability: string;
}

export interface ScoredCrop extends Crop {
  match_score: number;
  score_breakdown: {
    water_efficiency: number;
    profit: number;
    soil_match: number;
    drought: number;
  };
}

export interface CropMatchResult {
  top_crops: ScoredCrop[];
  companion_benefits: {
    crop_id: string;
    companion_crop_id: string;
    companion_name: string;
    intercropping_ratio: string;
    nitrogen_benefit_kg_ha: number;
    urea_equivalent_saved_kg: number;
    cost_saved_inr_ha: number;
  }[];
}

export class CropMatcher {
  /**
   * Filter crops based on hard constraints from district conditions
   */
  filterCrops(crops: Crop[], context: DistrictContext): Crop[] {
    return crops.filter((crop) => {
      const agro = crop.agronomy;

      // Temperature constraint: crop must survive district max temp
      if (agro.temp_max_survival_c < context.max_temp_c) {
        return false;
      }

      // pH constraint: district pH must be within crop's tolerance
      if (context.soil_ph < agro.ph_min || context.soil_ph > agro.ph_max) {
        return false;
      }

      // Water crisis constraint: if aquifer is depleting fast, only low-water crops
      if (context.years_until_bankruptcy < 10 && agro.water_liters_per_kg > 3000) {
        return false;
      }

      return true;
    });
  }

  /**
   * Score a single crop based on district context
   * Returns score 0-100
   */
  scoreCrop(crop: Crop, context: DistrictContext): ScoredCrop {
    const agro = crop.agronomy;
    const econ = crop.economics;

    // Water efficiency score (40 points max)
    // Lower water_liters_per_kg is better
    // Normalize: 1000 L/kg = perfect (40 pts), 22000 L/kg = 0 pts
    const waterNormalized = Math.max(0, Math.min(1, (22000 - agro.water_liters_per_kg) / 21000));
    const waterScore = waterNormalized * 40;

    // Profit band score (30 points max)
    // profit_band 1-5, where 5 is best
    const profitScore = (econ.profit_band / 5) * 30;

    // Soil match score (20 points max)
    // How well does the crop's pH range match the soil pH?
    const phRange = agro.ph_max - agro.ph_min;
    const phCenter = (agro.ph_max + agro.ph_min) / 2;
    const phDistance = Math.abs(context.soil_ph - phCenter);
    const phFit = Math.max(0, 1 - (phDistance / (phRange / 2 + 0.5)));
    let soilScore = phFit * 15;

    // Bonus for nitrogen fixation in degraded soils
    if (agro.nitrogen_fixation) {
      soilScore += 5;
    }

    // Drought tolerance score (10 points max)
    // Match drought tolerance to drought probability
    let droughtMultiplier = 1;
    const droughtProb = context.drought_probability.toLowerCase();
    if (droughtProb === 'very_high') {
      droughtMultiplier = 1.5;
    } else if (droughtProb === 'high') {
      droughtMultiplier = 1.3;
    } else if (droughtProb.includes('medium')) {
      droughtMultiplier = 1.1;
    }
    const droughtScore = agro.drought_tolerance * 10 * Math.min(droughtMultiplier, 1);

    const totalScore = Math.round(waterScore + profitScore + soilScore + droughtScore);

    return {
      ...crop,
      match_score: Math.min(100, totalScore),
      score_breakdown: {
        water_efficiency: Math.round(waterScore),
        profit: Math.round(profitScore),
        soil_match: Math.round(soilScore),
        drought: Math.round(droughtScore),
      },
    };
  }

  /**
   * Rank crops and return top N with companion benefits
   */
  rankCrops(
    crops: Crop[],
    companionRules: CompanionRule[],
    context: DistrictContext,
    topN: number = 3
  ): CropMatchResult {
    // Filter eligible crops
    const eligible = this.filterCrops(crops, context);

    // Score all eligible crops
    const scored = eligible.map((crop) => this.scoreCrop(crop, context));

    // Sort by score descending
    scored.sort((a, b) => b.match_score - a.match_score);

    // Take top N
    const topCrops = scored.slice(0, topN);

    // Build companion benefits for top crops
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
      .filter((b): b is NonNullable<typeof b> => b !== null);

    return {
      top_crops: topCrops,
      companion_benefits: companionBenefits,
    };
  }
}
