/**
 * Feature 1: Land Intelligence Narrative Prompt
 */

import type { District } from '../../../domain/entities/District.js';
import type { DistrictScores } from '../../../domain/value-objects/HealthScore.js';
import type { MistralMessage } from '../MistralClient.js';

export function buildNarrativePrompt(district: District, scores: DistrictScores): MistralMessage[] {
  const landIntel = district.feature_1_land_intelligence;

  const systemPrompt = `You are an expert agricultural analyst providing concise, actionable assessments of district agricultural health in India. Your role is to synthesize complex data into clear, 2-3 sentence narratives that highlight the most critical issues and their implications.

Guidelines:
- Be direct and specific about problems
- Use Indian context and terminology where appropriate
- Focus on water, soil, and climate interactions
- Mention specific numbers when they add value
- Keep the tone professional but accessible`;

  const userPrompt = `Generate a 2-3 sentence agricultural health narrative for ${district.name} district, ${district.state}.

HEALTH SCORES (0-100 scale):
- Soil Health: ${scores.soil.value}/100 (${scores.soil.level})
- Water Security: ${scores.water.value}/100 (${scores.water.level})
- Climate Resilience: ${scores.climate.value}/100 (${scores.climate.level})
- Crop Sustainability: ${scores.crop.value}/100 (${scores.crop.level})
- Overall Health: ${scores.overall.value}/100 (${scores.overall.level})

KEY DATA:
- Region Type: ${district.region_type}
- Soil: ${landIntel.geography.soil_type}, pH ${landIntel.geography.soil_ph}, ${landIntel.geography.organic_carbon_percent}% organic carbon
- Groundwater: ${landIntel.water.groundwater_depth_m}m depth, ${landIntel.water.years_until_bankruptcy} years until depletion
- Aquifer Status: ${landIntel.water.aquifer_status}
- Rainfall: ${landIntel.water.rainfall_mm_annual}mm annual, trend: ${landIntel.water.rainfall_trend_20yr}
- Climate: Max ${landIntel.climate.max_temp_c}°C, ${landIntel.climate.heat_stress_days_above_40c} heat stress days, ${landIntel.climate.drought_probability} drought probability
- Current Crop: ${landIntel.current_status.dominant_crop}
- Land Degradation: ${landIntel.current_status.land_degradation_status}

Provide a concise narrative (2-3 sentences) that:
1. States the overall health status
2. Identifies the primary concern
3. Hints at the urgency or timeline`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
