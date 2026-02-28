/**
 * GetHotspotsUseCase
 * Fetches hotspots GeoJSON with optional filtering by issue type
 */

import type { IHotspotsRepository, IssueType } from '../ports/IHotspotsRepository.js';
import type { GeoJsonFeatureCollection } from '../dtos/DistrictDtos.js';

export interface GetHotspotsParams {
  issue?: IssueType;
}

export class GetHotspotsUseCase {
  constructor(private readonly hotspotsRepo: IHotspotsRepository) {}

  async execute(params: GetHotspotsParams = {}): Promise<GeoJsonFeatureCollection> {
    const { issue } = params;

    if (issue) {
      return this.hotspotsRepo.filterByIssue(issue);
    }

    return this.hotspotsRepo.getAll();
  }
}
