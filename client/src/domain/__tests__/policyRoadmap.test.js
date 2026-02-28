/**
 * policyRoadmap Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { generate3YearRoadmap, calculatePoliticalFeasibility } from '../policyRoadmap.js';

describe('policyRoadmap', () => {
    describe('generate3YearRoadmap', () => {
        const rows = [
            { district_id: 'ahmednagar_mh', crop: 'cotton', budget_amount_inr_lakh: 1000, subsidy_type: 'input', target_area_hectares: 10000 },
            { district_id: 'yavatmal_mh', crop: 'cotton', budget_amount_inr_lakh: 500, subsidy_type: 'input', target_area_hectares: 5000 },
        ];

        it('produces exactly 3 years', () => {
            const result = generate3YearRoadmap(rows);
            expect(result.years).toHaveLength(3);
        });

        it('caps each year at 15% shift', () => {
            const result = generate3YearRoadmap(rows);
            expect(result.years[0].cumulative_shift_pct).toBe(15);
            expect(result.years[1].cumulative_shift_pct).toBe(30);
            expect(result.years[2].cumulative_shift_pct).toBe(45);
        });

        it('transitions 15% of total area each year', () => {
            const result = generate3YearRoadmap(rows);
            const totalArea = 15000; // 10000 + 5000
            expect(result.years[0].area_transitioned_ha).toBe(Math.round(totalArea * 0.15));
        });

        it('reports correct total area and budget', () => {
            const result = generate3YearRoadmap(rows);
            expect(result.totalArea).toBe(15000);
            expect(result.totalBudget).toBe(1500);
        });
    });

    describe('calculatePoliticalFeasibility', () => {
        it('returns 100 when no red flags and no budget shift', () => {
            const result = calculatePoliticalFeasibility(
                [{ district_id: 'a', crop: 'x', budget_amount_inr_lakh: 100 }],
                [], // no red flags
                0, // no shifted budget
                100,
                false
            );
            expect(result.score).toBe(100);
        });

        it('applies no-alternative penalty of 30', () => {
            const result = calculatePoliticalFeasibility(
                [{ district_id: 'a', crop: 'x', budget_amount_inr_lakh: 100 }],
                [],
                0,
                100,
                true // has critical with no alt
            );
            expect(result.score).toBe(70); // 100 - 30
        });

        it('penalizes when all rows have red flags', () => {
            const rows = [
                { district_id: 'a', crop: 'x', budget_amount_inr_lakh: 100 },
                { district_id: 'b', crop: 'y', budget_amount_inr_lakh: 100 },
            ];
            const redFlags = [
                { row_index: 0, severity: 'HIGH', district_id: 'a', crop: 'x', reason: '' },
                { row_index: 1, severity: 'HIGH', district_id: 'b', crop: 'y', reason: '' },
            ];
            const result = calculatePoliticalFeasibility(rows, redFlags, 0, 200, false);
            // farmers_affected_ratio = 1.0 → penalty = 30
            expect(result.score).toBe(70);
        });

        it('penalizes full budget shift', () => {
            const result = calculatePoliticalFeasibility(
                [{ district_id: 'a', crop: 'x', budget_amount_inr_lakh: 100 }],
                [],
                100, // full shift
                100,
                false
            );
            // budget_shift_percent = 1.0 → penalty = 40
            expect(result.score).toBe(60);
        });

        it('score never goes below 0', () => {
            const rows = [{ district_id: 'a', crop: 'x', budget_amount_inr_lakh: 100 }];
            const redFlags = [{ row_index: 0, severity: 'CRITICAL', district_id: 'a', crop: 'x', reason: '' }];
            const result = calculatePoliticalFeasibility(rows, redFlags, 100, 100, true);
            expect(result.score).toBeGreaterThanOrEqual(0);
        });
    });
});
