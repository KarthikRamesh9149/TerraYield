/**
 * GetDistrictUseCase
 * Fetches district data and calculates health scores
 */

import type { IDistrictRepository } from '../ports/IDistrictRepository.js';
import { ScoreCalculator } from '../../domain/services/ScoreCalculator.js';
import type { DistrictScoresData } from '../../domain/value-objects/HealthScore.js';
import { AppError } from '../../domain/errors/AppError.js';

export interface GetDistrictResult {
  district_id: string;
  name: string;
  state: string;
  region_type: string;
  scores: DistrictScoresData;
  land_intelligence: {
    geography: {
      lat_center: number;
      lon_center: number;
      elevation_m: number;
      soil_type: string;
      soil_ph: number;
      organic_carbon_percent: number;
      nitrogen_kg_hectare: number;
      texture: string;
    };
    water: {
      groundwater_depth_m: number;
      critical_depth_m: number;
      extraction_rate_m_year: number;
      years_until_bankruptcy: number;
      rainfall_mm_annual: number;
      rainfall_trend_20yr: string;
      aquifer_status: string;
    };
    climate: {
      max_temp_c: number;
      heat_stress_days_above_40c: number;
      drought_probability: string;
    };
    current_status: {
      dominant_crop: string;
      secondary_crop: string;
      current_crop_water_usage_liters_kg: number;
      land_degradation_status: string;
    };
  };
  crop_economics: {
    current_crop_profile: {
      crop: string;
      local_name: string;
      profit_per_hectare_inr: number;
      water_requirement_liters_kg: number;
    };
    recommended_alternative: {
      primary: string;
      local_name: string;
      companion: string;
      intercropping_ratio: string;
      profit_per_hectare_inr: number;
      water_requirement_liters_kg: number;
    };
    economic_arbitrage: {
      income_increase_pct: number;
      water_savings_pct: number;
      fertilizer_savings_inr_hectare: number;
    };
  };
  policy_arbitrage: {
    current_subsidies_waste: {
      total_subsidy_inr_crore: number;
      efficiency_score_pct: number;
    };
    recommended_reallocation: {
      shift_from: string;
      shift_to: string;
      amount_shift_inr_lakh: number;
    };
    impact_projection: {
      water_saved_billion_liters_yearly: number;
      farmers_benefited_count: number;
      co2_reduction_tons_yearly: number;
    };
  };
}

export class GetDistrictUseCase {
  constructor(
    private readonly districtRepo: IDistrictRepository,
    private readonly scoreCalculator: ScoreCalculator
  ) {}

  async execute(districtId: string): Promise<GetDistrictResult> {
    const district = await this.districtRepo.findById(districtId);

    if (!district) {
      throw AppError.notFound(`District with ID '${districtId}'`, {
        district_id: districtId,
        valid_ids: this.districtRepo.getValidIds(),
      });
    }

    const landIntel = district.feature_1_land_intelligence;
    const cropEcon = district.feature_2_crop_economics;
    const policyArb = district.feature_3_policy_arbitrage;

    // Calculate scores using pure domain service
    const scores = this.scoreCalculator.calculateAllScores(
      landIntel.geography,
      landIntel.water,
      landIntel.climate,
      landIntel.current_status
    );

    return {
      district_id: district.district_id,
      name: district.name,
      state: district.state,
      region_type: district.region_type,
      scores: {
        soil: scores.soil.toJSON(),
        water: scores.water.toJSON(),
        climate: scores.climate.toJSON(),
        crop: scores.crop.toJSON(),
        overall: scores.overall.toJSON(),
      },
      land_intelligence: {
        geography: landIntel.geography,
        water: landIntel.water,
        climate: landIntel.climate,
        current_status: landIntel.current_status,
      },
      crop_economics: {
        current_crop_profile: {
          crop: cropEcon.current_crop_profile.crop,
          local_name: cropEcon.current_crop_profile.local_name,
          profit_per_hectare_inr: cropEcon.current_crop_profile.profit_per_hectare_inr,
          water_requirement_liters_kg: cropEcon.current_crop_profile.water_requirement_liters_kg,
        },
        recommended_alternative: {
          primary: cropEcon.recommended_alternative.primary,
          local_name: cropEcon.recommended_alternative.local_name,
          companion: cropEcon.recommended_alternative.companion,
          intercropping_ratio: cropEcon.recommended_alternative.intercropping_ratio,
          profit_per_hectare_inr: cropEcon.recommended_alternative.profit_per_hectare_inr,
          water_requirement_liters_kg: cropEcon.recommended_alternative.water_requirement_liters_kg,
        },
        economic_arbitrage: cropEcon.economic_arbitrage,
      },
      policy_arbitrage: {
        current_subsidies_waste: {
          total_subsidy_inr_crore: policyArb.current_subsidies_waste.total_subsidy_inr_crore,
          efficiency_score_pct: policyArb.current_subsidies_waste.efficiency_score_pct,
        },
        recommended_reallocation: {
          shift_from: policyArb.recommended_reallocation.shift_from,
          shift_to: policyArb.recommended_reallocation.shift_to,
          amount_shift_inr_lakh: policyArb.recommended_reallocation.amount_shift_inr_lakh,
        },
        impact_projection: {
          water_saved_billion_liters_yearly: policyArb.impact_projection.water_saved_billion_liters_yearly,
          farmers_benefited_count: policyArb.impact_projection.farmers_benefited_count,
          co2_reduction_tons_yearly: policyArb.impact_projection.co2_reduction_tons_yearly,
        },
      },
    };
  }
}
