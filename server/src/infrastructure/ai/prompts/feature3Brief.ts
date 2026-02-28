/**
 * Feature 3: Policy Simulator Cabinet Brief Prompt
 */

import type { District } from '../../../domain/entities/District.js';
import type { MistralMessage } from '../MistralClient.js';

export function buildPolicyBriefPrompt(district: District): MistralMessage[] {
  const landIntel = district.feature_1_land_intelligence;
  const policy = district.feature_3_policy_arbitrage;
  const current = policy.current_subsidies_waste;
  const realloc = policy.recommended_reallocation;
  const impact = policy.impact_projection;

  const systemPrompt = `You are a senior policy advisor preparing cabinet briefs for agricultural reform in India. Your briefs are read by ministers and senior bureaucrats who need clear, actionable recommendations with supporting data.

Brief Structure:
1. SITUATION: 2-3 sentences on current state
2. PROBLEM: Key inefficiency or risk
3. RECOMMENDATION: Specific policy action
4. IMPACT: Quantified benefits
5. TIMELINE: Implementation phases
6. RISK MITIGATION: Farmer protection measures

Guidelines:
- Use formal policy language
- Include specific budget figures in crores/lakhs
- Quantify all impacts
- Be direct about urgency
- Include farmer protection measures
- Keep total brief under 300 words`;

  const userPrompt = `Generate a Cabinet Brief for agricultural subsidy reallocation in ${district.name} district, ${district.state}.

CURRENT SITUATION:
- Region Type: ${district.region_type}
- Total Annual Subsidy: ₹${current.total_subsidy_inr_crore} crore
- Current Efficiency: ${current.efficiency_score_pct}%
- Water Cost Externalized: ₹${current.water_cost_externalized_inr_lakh} lakh
- Aquifer Status: ${landIntel.water.aquifer_status}
- Years to Depletion: ${landIntel.water.years_until_bankruptcy}
- Dominant Crop: ${landIntel.current_status.dominant_crop}
- Land Degradation: ${landIntel.current_status.land_degradation_status}

RECOMMENDED REALLOCATION:
- Shift FROM: ${realloc.shift_from}
- Shift TO: ${realloc.shift_to}
- Amount: ₹${realloc.amount_shift_inr_lakh} lakh
- Timeline: ${realloc.phase_over_years} years
- Farmer Protection: ${realloc.farmer_income_protection}

PROJECTED ANNUAL IMPACT:
- Water Saved: ${impact.water_saved_billion_liters_yearly.toFixed(1)} billion liters
- Farmers Benefited: ${impact.farmers_benefited_count.toLocaleString()}
- CO₂ Reduction: ${impact.co2_reduction_tons_yearly.toLocaleString()} tons
- Import Substitution: ₹${impact.import_substitution_value_inr_crore} crore

Generate a formal Cabinet Brief (250-300 words) with:
- Clear executive summary
- Problem statement with data
- Specific recommendation
- Quantified impacts
- Implementation timeline
- Risk mitigation approach
- Final recommendation statement`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
