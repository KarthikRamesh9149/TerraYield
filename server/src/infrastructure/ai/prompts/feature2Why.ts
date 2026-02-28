/**
 * Feature 2: Crop Matchmaker "Why this fits" Prompt
 */

import type { District } from '../../../domain/entities/District.js';
import type { MistralMessage } from '../MistralClient.js';

export function buildCropWhyPrompt(district: District): MistralMessage[] {
  const landIntel = district.feature_1_land_intelligence;
  const cropEcon = district.feature_2_crop_economics;
  const current = cropEcon.current_crop_profile;
  const alt = cropEcon.recommended_alternative;
  const arb = cropEcon.economic_arbitrage;

  const systemPrompt = `You are an agricultural economist and crop scientist advising Indian farmers on sustainable crop transitions. Provide clear, persuasive explanations for why specific crop alternatives make sense given local conditions.

Guidelines:
- Use bullet points for clarity
- Include specific numbers for water savings, profit increases
- Mention local names in regional scripts when available
- Address farmer concerns about risk
- Reference companion planting benefits
- Keep explanation practical and actionable`;

  const userPrompt = `Explain why ${alt.primary} (${alt.local_name}) is the recommended alternative to ${current.crop} for ${district.name} district, ${district.state}.

CURRENT SITUATION:
- Region: ${district.region_type}
- Current Crop: ${current.crop} (${current.local_name})
- Water Usage: ${current.water_requirement_liters_kg.toLocaleString()} L/kg
- Profit: ₹${current.profit_per_hectare_inr.toLocaleString()}/hectare
- Input Costs: ₹${current.input_cost_fertilizer_inr_hectare.toLocaleString()} fertilizer, ₹${current.input_cost_pesticide_inr_hectare.toLocaleString()} pesticide
- Market: ${current.market_volatility} volatility, ${current.price_trend} prices

ENVIRONMENTAL CONSTRAINTS:
- Aquifer Status: ${landIntel.water.aquifer_status}
- Years to Depletion: ${landIntel.water.years_until_bankruptcy}
- Rainfall: ${landIntel.water.rainfall_mm_annual}mm annual
- Max Temp: ${landIntel.climate.max_temp_c}°C
- Drought Risk: ${landIntel.climate.drought_probability}
- Soil pH: ${landIntel.geography.soil_ph}
- Land Degradation: ${landIntel.current_status.land_degradation_status}

RECOMMENDED ALTERNATIVE:
- Primary Crop: ${alt.primary} (${alt.local_name})
- Companion: ${alt.companion}
- Intercropping Ratio: ${alt.intercropping_ratio}
- Water Usage: ${alt.water_requirement_liters_kg.toLocaleString()} L/kg
- Profit: ₹${alt.profit_per_hectare_inr.toLocaleString()}/hectare
- Nitrogen Fixation: ${alt.nitrogen_fixation ? 'Yes' : 'No'}
- MSP: ₹${alt.msp_per_quintal_inr.toLocaleString()}/quintal
- Market Trend: ${alt.market_trend}

PROJECTED BENEFITS:
- Income Increase: ${arb.income_increase_pct}%
- Water Savings: ${arb.water_savings_pct}%
- Fertilizer Savings: ₹${arb.fertilizer_savings_inr_hectare.toLocaleString()}/hectare

Generate a "Why This Fits" explanation with 4-5 bullet points covering:
1. Water efficiency gains
2. Climate/environmental suitability
3. Economic benefits (income, reduced inputs)
4. Companion planting advantages
5. Risk mitigation (MSP, market trends)`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
