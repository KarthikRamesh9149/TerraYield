/**
 * ScoreCalculator Unit Tests
 * Tests all score calculation methods
 */

import { describe, it, expect } from 'vitest';
import { ScoreCalculator } from '../ScoreCalculator.js';

const calc = new ScoreCalculator();

describe('ScoreCalculator', () => {
    // ─────────── Soil Score ───────────

    describe('calculateSoilScore', () => {
        it('lowers score for extreme pH (<5.5)', () => {
            const score = calc.calculateSoilScore({
                lat_center: 0, lon_center: 0, elevation_m: 500,
                soil_type: 'Test', soil_ph: 5.0, organic_carbon_percent: 1.0,
                nitrogen_kg_hectare: 280, texture: 'Loamy',
            });
            expect(score.value).toBeLessThan(100);
            expect(score.value).toBeLessThanOrEqual(70); // -30 for extreme pH
        });

        it('lowers score for low organic carbon', () => {
            const score = calc.calculateSoilScore({
                lat_center: 0, lon_center: 0, elevation_m: 500,
                soil_type: 'Test', soil_ph: 7.0, organic_carbon_percent: 0.2,
                nitrogen_kg_hectare: 280, texture: 'Loamy',
            });
            expect(score.value).toBeLessThanOrEqual(65); // -35 for very low carbon
        });

        it('returns high score for optimal conditions', () => {
            const score = calc.calculateSoilScore({
                lat_center: 0, lon_center: 0, elevation_m: 500,
                soil_type: 'Test', soil_ph: 7.0, organic_carbon_percent: 1.0,
                nitrogen_kg_hectare: 280, texture: 'Loamy',
            });
            expect(score.value).toBeGreaterThanOrEqual(95);
        });
    });

    // ─────────── Water Score ───────────

    describe('calculateWaterScore', () => {
        it('penalizes near-critical groundwater depth', () => {
            const score = calc.calculateWaterScore({
                groundwater_depth_m: 100,
                critical_depth_m: 120,  // ratio 0.83 > 0.8
                extraction_rate_m_year: 3,
                years_until_bankruptcy: 20,
                rainfall_mm_annual: 800,
                rainfall_trend_20yr: 'stable',
                aquifer_status: 'safe',
            });
            expect(score.value).toBeLessThanOrEqual(60); // -40 for near critical
        });

        it('penalizes imminent bankruptcy (<5 years)', () => {
            const score = calc.calculateWaterScore({
                groundwater_depth_m: 30,
                critical_depth_m: 120,
                extraction_rate_m_year: 3,
                years_until_bankruptcy: 3,
                rainfall_mm_annual: 800,
                rainfall_trend_20yr: 'stable',
                aquifer_status: 'safe',
            });
            expect(score.value).toBeLessThanOrEqual(65); // -35 for imminent crisis
        });

        it('penalizes overexploited aquifer status', () => {
            const score = calc.calculateWaterScore({
                groundwater_depth_m: 30,
                critical_depth_m: 120,
                extraction_rate_m_year: 3,
                years_until_bankruptcy: 20,
                rainfall_mm_annual: 800,
                rainfall_trend_20yr: 'stable',
                aquifer_status: 'overexploited',
            });
            expect(score.value).toBeLessThanOrEqual(85); // -15 for overexploited
        });
    });

    // ─────────── Climate Score ───────────

    describe('calculateClimateScore', () => {
        it('penalizes very high drought probability', () => {
            const score = calc.calculateClimateScore({
                max_temp_c: 38,
                heat_stress_days_above_40c: 0,
                drought_probability: 'very_high',
            });
            expect(score.value).toBeLessThanOrEqual(75); // -25
        });

        it('penalizes extreme temperatures (>47°C)', () => {
            const score = calc.calculateClimateScore({
                max_temp_c: 48,
                heat_stress_days_above_40c: 0,
                drought_probability: 'low',
            });
            expect(score.value).toBeLessThanOrEqual(70); // -30
        });

        it('returns high score for moderate climate', () => {
            const score = calc.calculateClimateScore({
                max_temp_c: 35,
                heat_stress_days_above_40c: 5,
                drought_probability: 'low',
            });
            expect(score.value).toBeGreaterThanOrEqual(95);
        });
    });

    // ─────────── Crop Score ───────────

    describe('calculateCropScore', () => {
        it('penalizes severe land degradation', () => {
            const score = calc.calculateCropScore({
                dominant_crop: 'cotton',
                secondary_crop: 'soybean',
                current_crop_water_usage_liters_kg: 5000,
                land_degradation_status: 'severe',
            });
            expect(score.value).toBeLessThanOrEqual(60); // -40
        });

        it('penalizes very high water usage (>30000)', () => {
            const score = calc.calculateCropScore({
                dominant_crop: 'rice',
                secondary_crop: 'wheat',
                current_crop_water_usage_liters_kg: 35000,
                land_degradation_status: 'none',
            });
            expect(score.value).toBeLessThanOrEqual(70); // -30
        });
    });

    // ─────────── Overall Health ───────────

    describe('calculateOverallHealth', () => {
        it('produces weighted average with water at 35%', () => {
            const overall = calc.calculateOverallHealth({
                soil: { value: 100, level: 'good' } as any,
                water: { value: 0, level: 'critical' } as any,
                climate: { value: 100, level: 'good' } as any,
                crop: { value: 100, level: 'good' } as any,
            });
            // 100*0.25 + 0*0.35 + 100*0.25 + 100*0.15 = 65
            expect(overall.value).toBe(65);
        });
    });
});
