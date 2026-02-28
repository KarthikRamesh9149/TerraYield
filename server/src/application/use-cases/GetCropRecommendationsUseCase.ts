/**
 * GetCropRecommendationsUseCase
 * Orchestrates crop recommendation based on district conditions
 */

import type { IDistrictRepository } from '../ports/IDistrictRepository.js';
import type { ICropRepository } from '../ports/ICropRepository.js';
import { CropMatcher, type DistrictContext } from '../../domain/services/CropMatcher.js';
import { AppError } from '../../domain/errors/AppError.js';
import type { CropRecommendationsResponse, EconomicComparison } from '../dtos/CropMatcherDtos.js';

export class GetCropRecommendationsUseCase {
  constructor(
    private readonly districtRepo: IDistrictRepository,
    private readonly cropRepo: ICropRepository,
    private readonly cropMatcher: CropMatcher
  ) {}

  async execute(districtId: string): Promise<CropRecommendationsResponse> {
    // Fetch district
    const district = await this.districtRepo.findById(districtId);

    if (!district) {
      throw AppError.notFound(`District with ID '${districtId}'`, {
        district_id: districtId,
        valid_ids: this.districtRepo.getValidIds(),
      });
    }

    // Get crops and companion rules
    const crops = await this.cropRepo.getAllCrops();
    const companionRules = await this.cropRepo.getCompanionRules();

    // Build district context for matching
    const landIntel = district.feature_1_land_intelligence;
    const context: DistrictContext = {
      district_id: district.district_id,
      soil_ph: landIntel.geography.soil_ph,
      max_temp_c: landIntel.climate.max_temp_c,
      years_until_bankruptcy: landIntel.water.years_until_bankruptcy,
      rainfall_mm_annual: landIntel.water.rainfall_mm_annual,
      drought_probability: landIntel.climate.drought_probability,
    };

    // Run crop matching
    const matchResult = this.cropMatcher.rankCrops(crops, companionRules, context, 3);

    // Build economic comparison if we have current crop data
    let economicComparison: EconomicComparison | undefined;
    const cropEcon = district.feature_2_crop_economics;
    if (cropEcon && matchResult.top_crops.length > 0) {
      const topCrop = matchResult.top_crops[0];
      const currentCrop = cropEcon.current_crop_profile;
      const recommended = cropEcon.recommended_alternative;

      economicComparison = {
        current: {
          crop: currentCrop.crop,
          profit_per_hectare_inr: currentCrop.profit_per_hectare_inr,
          water_liters_per_kg: currentCrop.water_requirement_liters_kg,
          fertilizer_cost_inr: currentCrop.input_cost_fertilizer_inr_hectare,
        },
        recommended: {
          crop: topCrop.name,
          profit_per_hectare_inr: recommended?.profit_per_hectare_inr || topCrop.economics.profit_band * 12000,
          water_liters_per_kg: topCrop.agronomy.water_liters_per_kg,
          fertilizer_cost_inr: recommended?.input_cost_fertilizer_inr_hectare || 8000,
        },
        savings: {
          income_increase_pct: cropEcon.economic_arbitrage?.income_increase_pct || 0,
          water_savings_pct: cropEcon.economic_arbitrage?.water_savings_pct || 0,
          fertilizer_savings_inr: cropEcon.economic_arbitrage?.fertilizer_savings_inr_hectare || 0,
        },
      };
    }

    return {
      district_id: district.district_id,
      district_name: district.name,
      top_crops: matchResult.top_crops,
      companion_benefits: matchResult.companion_benefits,
      economic_comparison: economicComparison,
      generated_at: new Date().toISOString(),
    };
  }
}
