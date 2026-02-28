/**
 * GeneratePolicyBriefUseCase (Feature 3)
 * Orchestrates policy cabinet brief generation
 */

import type { IDistrictRepository } from '../ports/IDistrictRepository.js';
import type { IAiService } from '../ports/IAiService.js';
import { AppError } from '../../domain/errors/AppError.js';

export interface GeneratePolicyBriefResult {
  district_id: string;
  cabinet_brief: string;
  policy_summary: {
    current_subsidy_crore: number;
    efficiency_score_pct: number;
    recommended_shift_lakh: number;
  };
  impact_projection: {
    water_saved_billion_liters: number;
    farmers_benefited: number;
    co2_reduction_tons: number;
  };
  generated_at: string;
}

export class GeneratePolicyBriefUseCase {
  constructor(
    private readonly districtRepo: IDistrictRepository,
    private readonly aiService: IAiService
  ) {}

  async execute(districtId: string): Promise<GeneratePolicyBriefResult> {
    // Fetch district
    const district = await this.districtRepo.findById(districtId);

    if (!district) {
      throw AppError.notFound(`District with ID '${districtId}'`, {
        district_id: districtId,
        valid_ids: this.districtRepo.getValidIds(),
      });
    }

    const policyArb = district.feature_3_policy_arbitrage;

    // Generate cabinet brief using AI service
    let cabinetBrief: string;

    if (this.aiService.isAvailable(3)) {
      cabinetBrief = await this.aiService.generatePolicyBrief({ district });
    } else {
      // Fallback brief when AI is not available
      cabinetBrief = this.generateFallbackBrief(district);
    }

    return {
      district_id: district.district_id,
      cabinet_brief: cabinetBrief,
      policy_summary: {
        current_subsidy_crore: policyArb.current_subsidies_waste.total_subsidy_inr_crore,
        efficiency_score_pct: policyArb.current_subsidies_waste.efficiency_score_pct,
        recommended_shift_lakh: policyArb.recommended_reallocation.amount_shift_inr_lakh,
      },
      impact_projection: {
        water_saved_billion_liters: policyArb.impact_projection.water_saved_billion_liters_yearly,
        farmers_benefited: policyArb.impact_projection.farmers_benefited_count,
        co2_reduction_tons: policyArb.impact_projection.co2_reduction_tons_yearly,
      },
      generated_at: new Date().toISOString(),
    };
  }

  private generateFallbackBrief(
    district: NonNullable<Awaited<ReturnType<IDistrictRepository['findById']>>>
  ): string {
    const policy = district.feature_3_policy_arbitrage;
    const current = policy.current_subsidies_waste;
    const realloc = policy.recommended_reallocation;
    const impact = policy.impact_projection;

    return `CABINET BRIEF: ${district.name} District Agricultural Subsidy Reallocation

EXECUTIVE SUMMARY
${district.name} district (${district.state}) requires urgent policy intervention to address unsustainable agricultural practices. Current subsidy efficiency stands at only ${current.efficiency_score_pct}%, with ₹${current.total_subsidy_inr_crore} crore in annual subsidies generating significant water cost externalities (₹${current.water_cost_externalized_inr_lakh} lakh).

CURRENT SITUATION
• Region Type: ${district.region_type}
• Primary Challenge: ${district.feature_1_land_intelligence.water.aquifer_status} aquifer with ${district.feature_1_land_intelligence.water.years_until_bankruptcy} years to depletion
• Dominant Crop: ${district.feature_1_land_intelligence.current_status.dominant_crop}
• Land Status: ${district.feature_1_land_intelligence.current_status.land_degradation_status} degradation

RECOMMENDED ACTION
Shift ₹${realloc.amount_shift_inr_lakh} lakh over ${realloc.phase_over_years} years:
• FROM: ${realloc.shift_from}
• TO: ${realloc.shift_to}

FARMER PROTECTION
${realloc.farmer_income_protection}

PROJECTED IMPACT (Annual)
• Water Saved: ${impact.water_saved_billion_liters_yearly.toFixed(1)} billion liters
• Farmers Benefited: ${impact.farmers_benefited_count.toLocaleString()}
• CO₂ Reduction: ${impact.co2_reduction_tons_yearly.toLocaleString()} tons
• Import Substitution: ₹${policy.impact_projection.import_substitution_value_inr_crore} crore

RECOMMENDATION: Approve phased reallocation with farmer income floor guarantee.`;
  }
}
