/**
 * Hotspots Repository Interface
 * Defines the contract for hotspots GeoJSON data access
 */

import type { GeoJsonFeatureCollection } from '../dtos/DistrictDtos.js';

export type IssueType = 'soil' | 'yield';

export interface IHotspotsRepository {
  /**
   * Get all hotspots as GeoJSON FeatureCollection
   * @returns Full hotspots GeoJSON
   */
  getAll(): Promise<GeoJsonFeatureCollection>;

  /**
   * Get hotspots filtered by issue type
   * @param issue - Issue type to filter by ('soil' | 'yield')
   * @returns Filtered hotspots GeoJSON (all features have the relevant properties)
   */
  filterByIssue(issue: IssueType): Promise<GeoJsonFeatureCollection>;
}
