/**
 * Policy Red Flags — pure domain logic (no I/O, no React)
 * Detects policy misallocations by cross-referencing crop data with district data
 */

/**
 * @typedef {'CRITICAL' | 'HIGH' | 'MEDIUM'} Severity
 * @typedef {{ severity: Severity, row_index: number, district_id: string, crop: string, reason: string }} RedFlag
 */

/**
 * Detect red flags in validated policy rows
 * @param {Object[]} rows - Validated policy rows
 * @param {Object[]} cropsDb - Crops database array
 * @param {Object} districtsMap - Map of district_id → district JSON data
 * @returns {RedFlag[]}
 */
export function detectRedFlags(rows, cropsDb, districtsMap) {
    const flags = [];

    rows.forEach((row, index) => {
        const district = districtsMap[row.district_id];
        if (!district) return;

        const crop = findCrop(row.crop, cropsDb);
        if (!crop) return;

        const landIntel = district.feature_1_land_intelligence;

        // CRITICAL: high-water crop in water-stressed district
        if (
            crop.agronomy.water_liters_per_kg > 15000 &&
            landIntel.water.years_until_bankruptcy < 10
        ) {
            flags.push({
                severity: 'CRITICAL',
                row_index: index,
                district_id: row.district_id,
                crop: row.crop,
                reason: `Crop uses ${crop.agronomy.water_liters_per_kg.toLocaleString()} L/kg water but district has only ${landIntel.water.years_until_bankruptcy} years until aquifer bankruptcy`,
            });
        }

        // HIGH: low-profit crop with big budget
        if (crop.economics.profit_band <= 2 && row.budget_amount_inr_lakh > 500) {
            flags.push({
                severity: 'HIGH',
                row_index: index,
                district_id: row.district_id,
                crop: row.crop,
                reason: `Allocating ₹${row.budget_amount_inr_lakh} lakh to a low-profit crop (profit band ${crop.economics.profit_band}/5)`,
            });
        }

        // MEDIUM: drought-intolerant crop in very-high-drought district
        if (
            landIntel.climate.drought_probability.toLowerCase() === 'very_high' &&
            crop.agronomy.drought_tolerance < 0.5
        ) {
            flags.push({
                severity: 'MEDIUM',
                row_index: index,
                district_id: row.district_id,
                crop: row.crop,
                reason: `Crop drought tolerance is only ${(crop.agronomy.drought_tolerance * 100).toFixed(0)}% in a very-high-drought district`,
            });
        }
    });

    return flags;
}

/**
 * Find a crop by name or crop_id in the database (fuzzy match)
 * @param {string} cropName
 * @param {Object[]} cropsDb
 * @returns {Object|null}
 */
export function findCrop(cropName, cropsDb) {
    const needle = cropName.toLowerCase().trim();
    return (
        cropsDb.find((c) => c.crop_id === needle) ||
        cropsDb.find((c) => c.name.toLowerCase().includes(needle)) ||
        cropsDb.find((c) => c.crop_id.includes(needle)) ||
        null
    );
}
