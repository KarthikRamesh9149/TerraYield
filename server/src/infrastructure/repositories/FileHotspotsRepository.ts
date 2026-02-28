/**
 * FileHotspotsRepository
 * Reads hotspots GeoJSON from the client/public folder
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { IHotspotsRepository, IssueType } from '../../application/ports/IHotspotsRepository.js';
import type { GeoJsonFeatureCollection } from '../../application/dtos/DistrictDtos.js';
import { logger } from '../logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class FileHotspotsRepository implements IHotspotsRepository {
  private cache: GeoJsonFeatureCollection | null = null;
  private readonly filePath: string;

  constructor() {
    // Path from server/src/infrastructure/repositories to client/public/hotspots.geojson
    this.filePath = join(__dirname, '..', '..', '..', '..', 'client', 'public', 'hotspots.geojson');
  }

  async getAll(): Promise<GeoJsonFeatureCollection> {
    if (this.cache) {
      logger.debug('Hotspots cache hit');
      return this.cache;
    }

    try {
      logger.debug({ path: this.filePath }, 'Reading hotspots file');

      const content = await readFile(this.filePath, 'utf-8');
      const geojson = JSON.parse(content) as GeoJsonFeatureCollection;

      // Cache the result
      this.cache = geojson;

      logger.info({ featureCount: geojson.features.length }, 'Hotspots loaded');
      return geojson;
    } catch (error) {
      logger.error({ error }, 'Failed to read hotspots file');
      // Return empty FeatureCollection on error
      return {
        type: 'FeatureCollection',
        features: [],
      };
    }
  }

  async filterByIssue(issue: IssueType): Promise<GeoJsonFeatureCollection> {
    const allHotspots = await this.getAll();

    // For now, all features have both soil and yield data
    // We return all features but could filter based on issue-specific criteria
    logger.debug({ issue, featureCount: allHotspots.features.length }, 'Filtering hotspots by issue');

    // Future: Could filter features that don't have the relevant issue data
    // For now, return all features as they all contain both soil_risk_score and yield_trend
    return allHotspots;
  }

  /**
   * Clear the cache (useful for testing or hot-reloading)
   */
  clearCache(): void {
    this.cache = null;
    logger.debug('Hotspots cache cleared');
  }
}
