/**
 * CropMatcher Unit Tests
 * Tests filtering, scoring, and ranking logic
 */

import { describe, it, expect } from 'vitest';
import { CropMatcher } from '../CropMatcher.js';
import type { Crop, DistrictContext, CompanionRule } from '../CropMatcher.js';

function makeCrop(overrides: Partial<Crop> = {}): Crop {
    return {
        crop_id: 'test_crop',
        name: 'Test Crop',
        local_name: 'टेस्ट',
        agronomy: {
            ph_min: 5.5,
            ph_max: 8.0,
            temp_max_survival_c: 45,
            water_need_mm: 400,
            drought_tolerance: 0.8,
            nitrogen_fixation: false,
            water_liters_per_kg: 2000,
        },
        economics: { profit_band: 4, msp_inr_quintal: 5000 },
        companion: { best_companion_crop_id: 'companion_a', intercropping_ratio: '70:30' },
        ...overrides,
    };
}

function makeContext(overrides: Partial<DistrictContext> = {}): DistrictContext {
    return {
        district_id: 'test_district',
        soil_ph: 7.0,
        max_temp_c: 42,
        years_until_bankruptcy: 12,
        rainfall_mm_annual: 600,
        drought_probability: 'medium',
        ...overrides,
    };
}

describe('CropMatcher', () => {
    const matcher = new CropMatcher();

    // ─────────── filterCrops ───────────

    describe('filterCrops', () => {
        it('excludes crops when district pH is out of range', () => {
            const crop = makeCrop({ agronomy: { ...makeCrop().agronomy, ph_min: 6.0, ph_max: 7.5 } });
            const ctx = makeContext({ soil_ph: 5.0 }); // below ph_min
            const result = matcher.filterCrops([crop], ctx);
            expect(result).toHaveLength(0);
        });

        it('excludes high-water crops in water-crisis districts', () => {
            const crop = makeCrop({
                agronomy: { ...makeCrop().agronomy, water_liters_per_kg: 5000 },
            });
            const ctx = makeContext({ years_until_bankruptcy: 8 }); // < 10
            const result = matcher.filterCrops([crop], ctx);
            expect(result).toHaveLength(0);
        });

        it('keeps low-water crops even in water-crisis districts', () => {
            const crop = makeCrop({
                agronomy: { ...makeCrop().agronomy, water_liters_per_kg: 2000 },
            });
            const ctx = makeContext({ years_until_bankruptcy: 8 });
            const result = matcher.filterCrops([crop], ctx);
            expect(result).toHaveLength(1);
        });

        it('excludes crops below max temp survival', () => {
            const crop = makeCrop({
                agronomy: { ...makeCrop().agronomy, temp_max_survival_c: 38 },
            });
            const ctx = makeContext({ max_temp_c: 42 }); // crop can't survive
            const result = matcher.filterCrops([crop], ctx);
            expect(result).toHaveLength(0);
        });

        it('keeps crops that survive district temp', () => {
            const crop = makeCrop({
                agronomy: { ...makeCrop().agronomy, temp_max_survival_c: 45 },
            });
            const ctx = makeContext({ max_temp_c: 42 });
            const result = matcher.filterCrops([crop], ctx);
            expect(result).toHaveLength(1);
        });
    });

    // ─────────── scoreCrop ───────────

    describe('scoreCrop', () => {
        it('gives nitrogen-fixing crops a soil bonus', () => {
            const cropNoN = makeCrop({ agronomy: { ...makeCrop().agronomy, nitrogen_fixation: false } });
            const cropWithN = makeCrop({ agronomy: { ...makeCrop().agronomy, nitrogen_fixation: true } });
            const ctx = makeContext();

            const scoreNoN = matcher.scoreCrop(cropNoN, ctx);
            const scoreWithN = matcher.scoreCrop(cropWithN, ctx);

            expect(scoreWithN.score_breakdown.soil_match).toBeGreaterThan(
                scoreNoN.score_breakdown.soil_match
            );
        });

        it('gives high drought-tolerant crops better drought scores', () => {
            const lowDrought = makeCrop({
                agronomy: { ...makeCrop().agronomy, drought_tolerance: 0.2 },
            });
            const highDrought = makeCrop({
                agronomy: { ...makeCrop().agronomy, drought_tolerance: 0.9 },
            });
            const ctx = makeContext();

            const scoreLow = matcher.scoreCrop(lowDrought, ctx);
            const scoreHigh = matcher.scoreCrop(highDrought, ctx);

            expect(scoreHigh.score_breakdown.drought).toBeGreaterThan(
                scoreLow.score_breakdown.drought
            );
        });

        it('returns a total score between 0 and 100', () => {
            const crop = makeCrop();
            const ctx = makeContext();
            const scored = matcher.scoreCrop(crop, ctx);
            expect(scored.match_score).toBeGreaterThanOrEqual(0);
            expect(scored.match_score).toBeLessThanOrEqual(100);
        });
    });

    // ─────────── rankCrops ───────────

    describe('rankCrops', () => {
        const crops: Crop[] = [
            makeCrop({ crop_id: 'a', economics: { profit_band: 5, msp_inr_quintal: 9000 } }),
            makeCrop({
                crop_id: 'b',
                agronomy: { ...makeCrop().agronomy, water_liters_per_kg: 15000, drought_tolerance: 0.3 },
                economics: { profit_band: 2, msp_inr_quintal: 2000 },
            }),
            makeCrop({
                crop_id: 'c',
                agronomy: { ...makeCrop().agronomy, nitrogen_fixation: true },
                economics: { profit_band: 4, msp_inr_quintal: 7000 },
            }),
            makeCrop({ crop_id: 'd', economics: { profit_band: 3, msp_inr_quintal: 3000 } }),
        ];

        const rules: CompanionRule[] = [];

        it('returns exactly 3 crops', () => {
            const ctx = makeContext();
            const result = matcher.rankCrops(crops, rules, ctx);
            expect(result.top_crops).toHaveLength(3);
        });

        it('returns crops sorted by match_score descending', () => {
            const ctx = makeContext();
            const result = matcher.rankCrops(crops, rules, ctx);
            for (let i = 1; i < result.top_crops.length; i++) {
                expect(result.top_crops[i - 1].match_score).toBeGreaterThanOrEqual(
                    result.top_crops[i].match_score
                );
            }
        });
    });
});
