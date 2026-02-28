/**
 * FileDistrictRepository
 * Reads district data from JSON files in the client/public/districts folder
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { District } from '../../domain/entities/District.js';
import type { IDistrictRepository } from '../../application/ports/IDistrictRepository.js';
import { logger } from '../logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Valid district IDs
const VALID_DISTRICT_IDS = [
  'ahmednagar_mh',
  'yavatmal_mh',
  'bathinda_pb',
  'mandya_ka',
] as const;

export class FileDistrictRepository implements IDistrictRepository {
  private cache: Map<string, District> = new Map();
  private readonly basePath: string;

  constructor() {
    // Path from server/src/infrastructure/repositories to client/public/districts
    this.basePath = join(__dirname, '..', '..', '..', '..', 'client', 'public', 'districts');
  }

  async findById(id: string): Promise<District | null> {
    // Check cache first
    if (this.cache.has(id)) {
      logger.debug({ district_id: id }, 'District cache hit');
      return this.cache.get(id)!;
    }

    // Validate ID
    if (!this.isValidId(id)) {
      logger.warn({ district_id: id }, 'Invalid district ID requested');
      return null;
    }

    try {
      const filePath = join(this.basePath, `${id}.json`);
      logger.debug({ path: filePath }, 'Reading district file');

      const content = await readFile(filePath, 'utf-8');
      const district = JSON.parse(content) as District;

      // Cache the result
      this.cache.set(id, district);

      logger.info({ district_id: id, name: district.name }, 'District loaded');
      return district;
    } catch (error) {
      logger.error({ district_id: id, error }, 'Failed to read district file');
      return null;
    }
  }

  async findAll(): Promise<District[]> {
    const districts: District[] = [];

    for (const id of VALID_DISTRICT_IDS) {
      const district = await this.findById(id);
      if (district) {
        districts.push(district);
      }
    }

    return districts;
  }

  async exists(id: string): Promise<boolean> {
    return this.isValidId(id);
  }

  getValidIds(): string[] {
    return [...VALID_DISTRICT_IDS];
  }

  private isValidId(id: string): boolean {
    return VALID_DISTRICT_IDS.includes(id as typeof VALID_DISTRICT_IDS[number]);
  }

  /**
   * Clear the cache (useful for testing or hot-reloading)
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('District cache cleared');
  }
}
