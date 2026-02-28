/**
 * District DTOs with Zod validation
 */

import { z } from 'zod';

// GeoJSON types
export const GeoJsonPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const GeoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
});

export const GeoJsonFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.record(z.unknown()),
  geometry: z.union([GeoJsonPointSchema, GeoJsonPolygonSchema]),
});

export const GeoJsonFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GeoJsonFeatureSchema),
});

export type GeoJsonFeatureCollection = z.infer<typeof GeoJsonFeatureCollectionSchema>;

// Hotspot feature properties
export const HotspotPropertiesSchema = z.object({
  district_id: z.string(),
  name: z.string(),
  state: z.string(),
  soil_risk_score: z.number().min(0).max(1),
  yield_trend: z.enum(['increasing', 'flat', 'decreasing']),
  yield_trend_pct: z.number(),
});

export type HotspotProperties = z.infer<typeof HotspotPropertiesSchema>;

// District response with scores
export const HealthScoreSchema = z.object({
  value: z.number().min(0).max(100),
  level: z.enum(['critical', 'warning', 'good']),
});

export const DistrictScoresSchema = z.object({
  soil: HealthScoreSchema,
  water: HealthScoreSchema,
  climate: HealthScoreSchema,
  crop: HealthScoreSchema,
  overall: HealthScoreSchema,
});

export const DistrictWithScoresResponseSchema = z.object({
  district_id: z.string(),
  name: z.string(),
  state: z.string(),
  region_type: z.string(),
  scores: DistrictScoresSchema,
  land_intelligence: z.object({
    geography: z.object({
      lat_center: z.number(),
      lon_center: z.number(),
      elevation_m: z.number(),
      soil_type: z.string(),
      soil_ph: z.number(),
      organic_carbon_percent: z.number(),
      nitrogen_kg_hectare: z.number(),
      texture: z.string(),
    }),
    water: z.object({
      groundwater_depth_m: z.number(),
      critical_depth_m: z.number(),
      extraction_rate_m_year: z.number(),
      years_until_bankruptcy: z.number(),
      rainfall_mm_annual: z.number(),
      rainfall_trend_20yr: z.string(),
      aquifer_status: z.string(),
    }),
    climate: z.object({
      max_temp_c: z.number(),
      heat_stress_days_above_40c: z.number(),
      drought_probability: z.string(),
    }),
    current_status: z.object({
      dominant_crop: z.string(),
      secondary_crop: z.string(),
      current_crop_water_usage_liters_kg: z.number(),
      land_degradation_status: z.string(),
    }),
  }),
  crop_economics: z.object({
    current_crop_profile: z.object({
      crop: z.string(),
      local_name: z.string(),
      profit_per_hectare_inr: z.number(),
      water_requirement_liters_kg: z.number(),
    }),
    recommended_alternative: z.object({
      primary: z.string(),
      local_name: z.string(),
      companion: z.string(),
      intercropping_ratio: z.string(),
      profit_per_hectare_inr: z.number(),
      water_requirement_liters_kg: z.number(),
    }),
    economic_arbitrage: z.object({
      income_increase_pct: z.number(),
      water_savings_pct: z.number(),
      fertilizer_savings_inr_hectare: z.number(),
    }),
  }),
  policy_arbitrage: z.object({
    current_subsidies_waste: z.object({
      total_subsidy_inr_crore: z.number(),
      efficiency_score_pct: z.number(),
    }),
    recommended_reallocation: z.object({
      shift_from: z.string(),
      shift_to: z.string(),
      amount_shift_inr_lakh: z.number(),
    }),
    impact_projection: z.object({
      water_saved_billion_liters_yearly: z.number(),
      farmers_benefited_count: z.number(),
      co2_reduction_tons_yearly: z.number(),
    }),
  }),
});

export type DistrictWithScoresResponse = z.infer<typeof DistrictWithScoresResponseSchema>;

// Hotspots query params
export const HotspotsQuerySchema = z.object({
  issue: z.enum(['soil', 'yield']).optional(),
  bbox: z.string().optional(),
  zoom: z.coerce.number().optional(),
});

export type HotspotsQuery = z.infer<typeof HotspotsQuerySchema>;
