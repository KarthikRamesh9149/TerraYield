export interface Geography {
  lat_center: number;
  lon_center: number;
  elevation_m: number;
  soil_type: string;
  soil_ph: number;
  organic_carbon_percent: number;
  nitrogen_kg_hectare: number;
  texture: string;
}

export interface Water {
  groundwater_depth_m: number;
  critical_depth_m: number;
  extraction_rate_m_year: number;
  years_until_bankruptcy: number;
  rainfall_mm_annual: number;
  rainfall_trend_20yr: string;
  aquifer_status: string;
}

export interface Climate {
  max_temp_c: number;
  heat_stress_days_above_40c: number;
  drought_probability: string;
}

export interface CurrentStatus {
  dominant_crop: string;
  secondary_crop: string;
  current_crop_water_usage_liters_kg: number;
  land_degradation_status: string;
}

export interface LandIntelligence {
  geography: Geography;
  water: Water;
  climate: Climate;
  current_status: CurrentStatus;
}

export interface CurrentCropProfile {
  crop: string;
  local_name: string;
  profit_per_hectare_inr: number;
  water_requirement_liters_kg: number;
  input_cost_fertilizer_inr_hectare: number;
  input_cost_pesticide_inr_hectare: number;
  pesticide_sprays_per_season: number;
  msp_exists: boolean;
  market_volatility: string;
  price_trend: string;
}

export interface RecommendedAlternative {
  primary: string;
  local_name: string;
  companion: string;
  intercropping_ratio: string;
  profit_per_hectare_inr: number;
  water_requirement_liters_kg: number;
  nitrogen_fixation: boolean;
  input_cost_fertilizer_inr_hectare: number;
  msp_per_quintal_inr: number;
  market_trend: string;
  reasoning: string;
}

export interface EconomicArbitrage {
  income_increase_pct: number;
  water_savings_pct: number;
  fertilizer_savings_inr_hectare: number;
}

export interface CropEconomics {
  current_crop_profile: CurrentCropProfile;
  recommended_alternative: RecommendedAlternative;
  economic_arbitrage: EconomicArbitrage;
}

export interface CurrentSubsidiesWaste {
  total_subsidy_inr_crore: number;
  efficiency_score_pct: number;
  water_cost_externalized_inr_lakh: number;
}

export interface RecommendedReallocation {
  shift_from: string;
  shift_to: string;
  amount_shift_inr_lakh: number;
  phase_over_years: number;
  farmer_income_protection: string;
}

export interface ImpactProjection {
  water_saved_billion_liters_yearly: number;
  farmers_benefited_count: number;
  co2_reduction_tons_yearly: number;
  import_substitution_value_inr_crore: number;
}

export interface PolicyArbitrage {
  current_subsidies_waste: CurrentSubsidiesWaste;
  recommended_reallocation: RecommendedReallocation;
  impact_projection: ImpactProjection;
}

export interface District {
  district_id: string;
  name: string;
  state: string;
  region_type: string;
  feature_1_land_intelligence: LandIntelligence;
  feature_2_crop_economics: CropEconomics;
  feature_3_policy_arbitrage: PolicyArbitrage;
}
