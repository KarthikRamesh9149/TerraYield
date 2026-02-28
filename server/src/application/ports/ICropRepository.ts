/**
 * ICropRepository - Port interface for crop data access
 */

import type { Crop, CompanionRule } from '../../domain/services/CropMatcher.js';

export interface ICropRepository {
  /**
   * Get all available crops from the database
   */
  getAllCrops(): Promise<Crop[]>;

  /**
   * Get all companion planting rules
   */
  getCompanionRules(): Promise<CompanionRule[]>;

  /**
   * Find a specific companion rule for a crop pair
   */
  findCompanionRule(cropId: string, companionId: string): Promise<CompanionRule | null>;

  /**
   * Find a crop by its ID
   */
  findCropById(cropId: string): Promise<Crop | null>;
}

export type { Crop, CompanionRule };
