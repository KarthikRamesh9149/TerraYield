/**
 * Policy Arbitrage — pure domain logic (no I/O, no React)
 * Calculates crop transition opportunities from policy rows
 */

import { findCrop } from './policyRedFlags.js';

/**
 * @typedef {{ from_crop: string, to_crop: string, budget_inr_lakh: number, water_reduction_pct: number, feasibility: 'high'|'medium'|'low' }} ArbitrageRow
 */

/**
 * Calculate arbitrage opportunities for each policy row
 * Reuses scoring logic from cropApi.js generateStubRecommendations
 * @param {Object[]} rows - Validated policy rows
 * @param {Object[]} cropsDb - Crops database array
 * @param {Object} districtsMap - Map of district_id → district JSON
 * @returns {ArbitrageRow[]}
 */
export function calculateArbitrage(rows, cropsDb, districtsMap) {
    const results = [];

    for (const row of rows) {
        const district = districtsMap[row.district_id];
        if (!district) continue;

        const currentCrop = findCrop(row.crop, cropsDb);
        if (!currentCrop) continue;

        const landIntel = district.feature_1_land_intelligence;

        // Find best alternative crop using simplified scoring
        const candidates = cropsDb.filter((c) => {
            if (c.crop_id === currentCrop.crop_id) return false;
            // Basic filtering (same as cropApi.js)
            if (c.agronomy.temp_max_survival_c < landIntel.climate.max_temp_c) return false;
            if (
                landIntel.geography.soil_ph < c.agronomy.ph_min ||
                landIntel.geography.soil_ph > c.agronomy.ph_max
            )
                return false;
            if (landIntel.water.years_until_bankruptcy < 10 && c.agronomy.water_liters_per_kg > 3000)
                return false;
            return true;
        });

        if (candidates.length === 0) continue;

        // Score candidates
        const scored = candidates.map((c) => {
            const waterScore = Math.max(0, (22000 - c.agronomy.water_liters_per_kg) / 21000) * 40;
            const profitScore = (c.economics.profit_band / 5) * 30;
            const droughtScore = c.agronomy.drought_tolerance * 10;
            const soilScore = c.agronomy.nitrogen_fixation ? 20 : 15;
            return { crop: c, score: waterScore + profitScore + droughtScore + soilScore };
        });

        scored.sort((a, b) => b.score - a.score);
        const bestAlt = scored[0].crop;

        // Calculate water reduction
        const currentWater = currentCrop.agronomy.water_liters_per_kg;
        const altWater = bestAlt.agronomy.water_liters_per_kg;
        const waterReduction =
            currentWater > 0 ? Math.round(((currentWater - altWater) / currentWater) * 100) : 0;

        // Determine feasibility
        let feasibility = 'medium';
        if (waterReduction > 50 && bestAlt.economics.profit_band >= 4) {
            feasibility = 'high';
        } else if (waterReduction < 20 || bestAlt.economics.profit_band <= 2) {
            feasibility = 'low';
        }

        results.push({
            from_crop: currentCrop.name,
            to_crop: bestAlt.name,
            budget_inr_lakh: row.budget_amount_inr_lakh,
            water_reduction_pct: Math.max(0, waterReduction),
            feasibility,
        });
    }

    return results;
}
