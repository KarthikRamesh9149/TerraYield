/**
 * District Repository Interface
 * Defines the contract for district data access
 */

import type { District } from '../../domain/entities/District.js';

export interface IDistrictRepository {
  /**
   * Find a district by its ID
   * @param id - District ID (e.g., 'ahmednagar_mh')
   * @returns District if found, null otherwise
   */
  findById(id: string): Promise<District | null>;

  /**
   * Get all available districts
   * @returns Array of all districts
   */
  findAll(): Promise<District[]>;

  /**
   * Check if a district exists
   * @param id - District ID
   * @returns true if district exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get list of valid district IDs
   * @returns Array of valid district ID strings
   */
  getValidIds(): string[];
}
