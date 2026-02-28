/**
 * LLM Request/Response DTOs with Zod validation
 */

import { z } from 'zod';

// Valid district IDs
const VALID_DISTRICT_IDS = [
  'ahmednagar_mh',
  'yavatmal_mh',
  'bathinda_pb',
  'mandya_ka',
] as const;

export const DistrictIdSchema = z.enum(VALID_DISTRICT_IDS);
export type DistrictIdType = z.infer<typeof DistrictIdSchema>;

// Feature 1: Land Intelligence Narrative
export const Feature1RequestSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

export const Feature1ResponseSchema = z.object({
  district_id: z.string(),
  narrative: z.string(),
  scores: z.object({
    soil: z.object({ value: z.number(), level: z.string() }),
    water: z.object({ value: z.number(), level: z.string() }),
    climate: z.object({ value: z.number(), level: z.string() }),
    crop: z.object({ value: z.number(), level: z.string() }),
    overall: z.object({ value: z.number(), level: z.string() }),
  }),
  generated_at: z.string(),
});

export type Feature1Request = z.infer<typeof Feature1RequestSchema>;
export type Feature1Response = z.infer<typeof Feature1ResponseSchema>;

// Feature 2: Crop Matchmaker "Why this fits"
export const Feature2RequestSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

export const Feature2ResponseSchema = z.object({
  district_id: z.string(),
  current_crop: z.string(),
  recommended_crop: z.string(),
  companion_crop: z.string(),
  why_explanation: z.string(),
  economic_benefits: z.object({
    income_increase_pct: z.number(),
    water_savings_pct: z.number(),
    fertilizer_savings_inr: z.number(),
  }),
  generated_at: z.string(),
});

export type Feature2Request = z.infer<typeof Feature2RequestSchema>;
export type Feature2Response = z.infer<typeof Feature2ResponseSchema>;

// Feature 3: Policy Simulator Cabinet Brief
export const Feature3RequestSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

export const Feature3ResponseSchema = z.object({
  district_id: z.string(),
  cabinet_brief: z.string(),
  policy_summary: z.object({
    current_subsidy_crore: z.number(),
    efficiency_score_pct: z.number(),
    recommended_shift_lakh: z.number(),
  }),
  impact_projection: z.object({
    water_saved_billion_liters: z.number(),
    farmers_benefited: z.number(),
    co2_reduction_tons: z.number(),
  }),
  generated_at: z.string(),
});

export type Feature3Request = z.infer<typeof Feature3RequestSchema>;
export type Feature3Response = z.infer<typeof Feature3ResponseSchema>;

// Generic LLM error response
export const LlmErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type LlmErrorResponse = z.infer<typeof LlmErrorResponseSchema>;
