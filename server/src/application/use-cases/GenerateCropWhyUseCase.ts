/**
 * GenerateCropWhyUseCase (Feature 2)
 * Orchestrates crop recommendation explanation generation
 */

import type { IDistrictRepository } from '../ports/IDistrictRepository.js';
import type { IAiService } from '../ports/IAiService.js';
import { AppError } from '../../domain/errors/AppError.js';

export interface GenerateCropWhyResult {
  district_id: string;
  current_crop: string;
  recommended_crop: string;
  companion_crop: string;
  why_explanation: string;
  economic_benefits: {
    income_increase_pct: number;
    water_savings_pct: number;
    fertilizer_savings_inr: number;
  };
  generated_at: string;
}

export class GenerateCropWhyUseCase {
  constructor(
    private readonly districtRepo: IDistrictRepository,
    private readonly aiService: IAiService
  ) {}

  async execute(districtId: string): Promise<GenerateCropWhyResult> {
    // Fetch district
    const district = await this.districtRepo.findById(districtId);

    if (!district) {
      throw AppError.notFound(`District with ID '${districtId}'`, {
        district_id: districtId,
        valid_ids: this.districtRepo.getValidIds(),
      });
    }

    const cropEcon = district.feature_2_crop_economics;

    // Generate explanation using AI service
    let whyExplanation: string;

    if (this.aiService.isAvailable(2)) {
      whyExplanation = await this.aiService.generateCropWhy({ district });
    } else {
      // Fallback explanation when AI is not available
      whyExplanation = this.generateFallbackExplanation(district);
    }

    return {
      district_id: district.district_id,
      current_crop: cropEcon.current_crop_profile.crop,
      recommended_crop: cropEcon.recommended_alternative.primary,
      companion_crop: cropEcon.recommended_alternative.companion,
      why_explanation: whyExplanation,
      economic_benefits: {
        income_increase_pct: cropEcon.economic_arbitrage.income_increase_pct,
        water_savings_pct: cropEcon.economic_arbitrage.water_savings_pct,
        fertilizer_savings_inr: cropEcon.economic_arbitrage.fertilizer_savings_inr_hectare,
      },
      generated_at: new Date().toISOString(),
    };
  }

  private generateFallbackExplanation(
    district: NonNullable<Awaited<ReturnType<IDistrictRepository['findById']>>>
  ): string {
    const cropEcon = district.feature_2_crop_economics;
    const landIntel = district.feature_1_land_intelligence;
    const alt = cropEcon.recommended_alternative;
    const arb = cropEcon.economic_arbitrage;

    return `Why ${alt.primary} (${alt.local_name}) fits ${district.name}:

• Water Efficiency: Requires only ${alt.water_requirement_liters_kg.toLocaleString()} L/kg compared to ${cropEcon.current_crop_profile.water_requirement_liters_kg.toLocaleString()} L/kg for ${cropEcon.current_crop_profile.crop}, achieving ${arb.water_savings_pct}% water savings critical for the ${landIntel.water.aquifer_status} aquifer status.

• Climate Resilience: Well-suited to ${district.region_type} conditions with max temperatures of ${landIntel.climate.max_temp_c}°C and ${landIntel.climate.drought_probability} drought probability.

• Economic Advantage: Projects ${arb.income_increase_pct}% income increase with ₹${arb.fertilizer_savings_inr_hectare.toLocaleString()}/hectare fertilizer savings through ${alt.nitrogen_fixation ? 'nitrogen fixation' : 'reduced input requirements'}.

• Companion Planting: ${alt.intercropping_ratio} ratio with ${alt.companion} provides yield stability and additional market diversification.

${alt.reasoning}`;
  }
}
