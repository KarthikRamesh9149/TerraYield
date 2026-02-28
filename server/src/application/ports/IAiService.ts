/**
 * AI Service Interface
 * Defines the contract for AI-powered text generation
 * Abstracts away the specific LLM provider (Mistral, OpenAI, etc.)
 */

import type { District } from '../../domain/entities/District.js';
import type { DistrictScores } from '../../domain/value-objects/HealthScore.js';

export interface NarrativeContext {
  district: District;
  scores: DistrictScores;
}

export interface CropContext {
  district: District;
}

export interface PolicyContext {
  district: District;
}

export interface IAiService {
  /**
   * Generate a land intelligence narrative for Feature 1
   * @param context - District data and calculated scores
   * @returns AI-generated narrative text (2-3 sentences)
   */
  generateNarrative(context: NarrativeContext): Promise<string>;

  /**
   * Generate crop recommendation explanation for Feature 2
   * @param context - District data with crop economics
   * @returns AI-generated "why this fits" bullet points
   */
  generateCropWhy(context: CropContext): Promise<string>;

  /**
   * Generate policy cabinet brief for Feature 3
   * @param context - District data with policy arbitrage info
   * @returns AI-generated cabinet brief text
   */
  generatePolicyBrief(context: PolicyContext): Promise<string>;

  /**
   * Check if the AI service is available (has valid API keys)
   * @param feature - Feature number (1, 2, or 3)
   * @returns true if the service can make AI calls for this feature
   */
  isAvailable(feature: 1 | 2 | 3): boolean;
}

/**
 * Feature type for API key selection
 */
export type FeatureType = 'feature1' | 'feature2' | 'feature3' | 'brief';
