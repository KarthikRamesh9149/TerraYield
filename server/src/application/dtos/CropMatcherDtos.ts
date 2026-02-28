/**
 * Crop Matchmaker DTOs with Zod validation
 */

import { z } from 'zod';

// Request schema for crop recommendations
export const CropRecommendationsRequestSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

export type CropRecommendationsRequest = z.infer<typeof CropRecommendationsRequestSchema>;

// Crop agronomy schema
export const CropAgronomySchema = z.object({
  ph_min: z.number(),
  ph_max: z.number(),
  temp_max_survival_c: z.number(),
  water_need_mm: z.number(),
  drought_tolerance: z.number().min(0).max(1),
  nitrogen_fixation: z.boolean(),
  water_liters_per_kg: z.number(),
});

// Crop economics schema
export const CropEconomicsSchema = z.object({
  profit_band: z.number().min(1).max(5),
  msp_inr_quintal: z.number().nullable(),
});

// Crop companion schema
export const CropCompanionSchema = z.object({
  best_companion_crop_id: z.string(),
  intercropping_ratio: z.string(),
});

// Full crop schema
export const CropSchema = z.object({
  crop_id: z.string(),
  name: z.string(),
  local_name: z.string(),
  agronomy: CropAgronomySchema,
  economics: CropEconomicsSchema,
  companion: CropCompanionSchema,
});

// Score breakdown schema
export const ScoreBreakdownSchema = z.object({
  water_efficiency: z.number(),
  profit: z.number(),
  soil_match: z.number(),
  drought: z.number(),
});

// Scored crop schema (crop with match score)
export const ScoredCropSchema = CropSchema.extend({
  match_score: z.number().min(0).max(100),
  score_breakdown: ScoreBreakdownSchema,
});

// Companion benefit schema
export const CompanionBenefitSchema = z.object({
  crop_id: z.string(),
  companion_crop_id: z.string(),
  companion_name: z.string(),
  intercropping_ratio: z.string(),
  nitrogen_benefit_kg_ha: z.number(),
  urea_equivalent_saved_kg: z.number(),
  cost_saved_inr_ha: z.number(),
});

// Current vs recommended comparison
export const EconomicComparisonSchema = z.object({
  current: z.object({
    crop: z.string(),
    profit_per_hectare_inr: z.number(),
    water_liters_per_kg: z.number(),
    fertilizer_cost_inr: z.number(),
  }),
  recommended: z.object({
    crop: z.string(),
    profit_per_hectare_inr: z.number(),
    water_liters_per_kg: z.number(),
    fertilizer_cost_inr: z.number(),
  }),
  savings: z.object({
    income_increase_pct: z.number(),
    water_savings_pct: z.number(),
    fertilizer_savings_inr: z.number(),
  }),
});

// Full response schema
export const CropRecommendationsResponseSchema = z.object({
  district_id: z.string(),
  district_name: z.string(),
  top_crops: z.array(ScoredCropSchema),
  companion_benefits: z.array(CompanionBenefitSchema),
  economic_comparison: EconomicComparisonSchema.optional(),
  generated_at: z.string(),
});

export type CropRecommendationsResponse = z.infer<typeof CropRecommendationsResponseSchema>;
export type ScoredCrop = z.infer<typeof ScoredCropSchema>;
export type CompanionBenefit = z.infer<typeof CompanionBenefitSchema>;
export type EconomicComparison = z.infer<typeof EconomicComparisonSchema>;
