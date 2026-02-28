/**
 * policyRedFlags Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { detectRedFlags, findCrop } from '../policyRedFlags.js';

// Minimal crop database
const cropsDb = [
    {
        crop_id: 'cotton_bt',
        name: 'Cotton (BT)',
        local_name: 'कापूस',
        agronomy: {
            ph_min: 6.0, ph_max: 8.5,
            temp_max_survival_c: 45,
            water_need_mm: 700,
            drought_tolerance: 0.45,
            nitrogen_fixation: false,
            water_liters_per_kg: 22000, // > 15000
        },
        economics: { profit_band: 2, msp_inr_quintal: 6620 },
        companion: { best_companion_crop_id: 'moong', intercropping_ratio: '85:15' },
    },
    {
        crop_id: 'tur_dal',
        name: 'Pigeon Pea (Tur Dal)',
        local_name: 'तूर',
        agronomy: {
            ph_min: 5.0, ph_max: 8.5,
            temp_max_survival_c: 45,
            water_need_mm: 400,
            drought_tolerance: 0.85,
            nitrogen_fixation: true,
            water_liters_per_kg: 2200,
        },
        economics: { profit_band: 4, msp_inr_quintal: 7550 },
        companion: { best_companion_crop_id: 'jowar', intercropping_ratio: '80:20' },
    },
];

// Minimal district data
const districtsMap = {
    ahmednagar_mh: {
        district_id: 'ahmednagar_mh',
        feature_1_land_intelligence: {
            water: { years_until_bankruptcy: 8 },
            climate: { drought_probability: 'very_high' },
        },
    },
    mandya_ka: {
        district_id: 'mandya_ka',
        feature_1_land_intelligence: {
            water: { years_until_bankruptcy: 25 },
            climate: { drought_probability: 'low' },
        },
    },
};

describe('policyRedFlags', () => {
    describe('detectRedFlags', () => {
        it('fires CRITICAL when water_liters_per_kg > 15000 AND bankruptcy < 10', () => {
            const rows = [
                { district_id: 'ahmednagar_mh', crop: 'cotton_bt', budget_amount_inr_lakh: 100, subsidy_type: 'input', target_area_hectares: 500 },
            ];
            const flags = detectRedFlags(rows, cropsDb, districtsMap);
            expect(flags.some((f) => f.severity === 'CRITICAL')).toBe(true);
        });

        it('fires HIGH when profit_band <= 2 AND budget > 500', () => {
            const rows = [
                { district_id: 'mandya_ka', crop: 'cotton_bt', budget_amount_inr_lakh: 600, subsidy_type: 'input', target_area_hectares: 500 },
            ];
            const flags = detectRedFlags(rows, cropsDb, districtsMap);
            expect(flags.some((f) => f.severity === 'HIGH')).toBe(true);
        });

        it('fires MEDIUM when drought is very_high AND drought_tolerance < 0.5', () => {
            const rows = [
                { district_id: 'ahmednagar_mh', crop: 'cotton_bt', budget_amount_inr_lakh: 100, subsidy_type: 'input', target_area_hectares: 500 },
            ];
            const flags = detectRedFlags(rows, cropsDb, districtsMap);
            expect(flags.some((f) => f.severity === 'MEDIUM')).toBe(true);
        });

        it('produces no false positives on clean data', () => {
            const rows = [
                { district_id: 'mandya_ka', crop: 'tur_dal', budget_amount_inr_lakh: 100, subsidy_type: 'drip', target_area_hectares: 500 },
            ];
            const flags = detectRedFlags(rows, cropsDb, districtsMap);
            expect(flags).toHaveLength(0);
        });
    });

    describe('findCrop', () => {
        it('matches by crop_id', () => {
            expect(findCrop('cotton_bt', cropsDb)?.crop_id).toBe('cotton_bt');
        });

        it('matches by name substring', () => {
            expect(findCrop('pigeon pea', cropsDb)?.crop_id).toBe('tur_dal');
        });

        it('returns null for unknown crops', () => {
            expect(findCrop('banana', cropsDb)).toBeNull();
        });
    });
});
