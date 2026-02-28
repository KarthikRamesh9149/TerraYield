/**
 * Policy Roadmap — pure domain logic (no I/O, no React)
 * Generates 3-year transition roadmap + political feasibility score
 */

/**
 * Generate a 3-year transition roadmap
 * Max 15% of target_area_hectares can shift per year
 * Total shift = 45% max over 3 years (15% × 3)
 *
 * @param {Object[]} rows - Validated policy rows
 * @returns {{ years: Object[], totalArea: number, totalBudget: number }}
 */
export function generate3YearRoadmap(rows) {
    const totalArea = rows.reduce((sum, r) => sum + r.target_area_hectares, 0);
    const totalBudget = rows.reduce((sum, r) => sum + r.budget_amount_inr_lakh, 0);

    const MAX_SHIFT_PER_YEAR = 0.15;
    const years = [];
    let cumulativeShift = 0;

    for (let year = 1; year <= 3; year++) {
        const areaThisYear = totalArea * MAX_SHIFT_PER_YEAR;
        const budgetThisYear = totalBudget * MAX_SHIFT_PER_YEAR;
        cumulativeShift += MAX_SHIFT_PER_YEAR;

        years.push({
            year,
            area_transitioned_ha: Math.round(areaThisYear),
            budget_allocated_lakh: Math.round(budgetThisYear * 100) / 100,
            cumulative_shift_pct: Math.round(cumulativeShift * 100),
        });
    }

    return { years, totalArea, totalBudget };
}

/**
 * Calculate Political Feasibility Score (0–100)
 *
 * score = 100 - ((farmers_affected_ratio × 30) + (budget_shift_percent × 40) + (no_alternative_penalty × 30))
 *
 * @param {Object[]} rows - Validated policy rows
 * @param {Object[]} redFlags - Array of detected red flags
 * @param {number} shiftedBudget - Sum of budgets being shifted
 * @param {number} totalBudget - Total budget across all rows
 * @param {boolean} hasCriticalWithNoAlternative - True if any CRITICAL flag has no feasible alternative
 * @returns {{ score: number, breakdown: Object }}
 */
export function calculatePoliticalFeasibility(
    rows,
    redFlags,
    shiftedBudget,
    totalBudget,
    hasCriticalWithNoAlternative = false
) {
    // Ratio of rows with red flags to total rows
    const affectedRowIndices = new Set(redFlags.map((f) => f.row_index));
    const farmersAffectedRatio = rows.length > 0 ? affectedRowIndices.size / rows.length : 0;

    // Budget shift percentage
    const budgetShiftPercent = totalBudget > 0 ? shiftedBudget / totalBudget : 0;

    // Penalty for CRITICAL red flags with no alternative
    const noAlternativePenalty = hasCriticalWithNoAlternative ? 1 : 0;

    const score = Math.max(
        0,
        Math.min(
            100,
            Math.round(
                100 -
                (farmersAffectedRatio * 30 + budgetShiftPercent * 40 + noAlternativePenalty * 30)
            )
        )
    );

    return {
        score,
        breakdown: {
            farmers_affected_ratio: Math.round(farmersAffectedRatio * 100) / 100,
            budget_shift_percent: Math.round(budgetShiftPercent * 100) / 100,
            no_alternative_penalty: noAlternativePenalty,
        },
    };
}
