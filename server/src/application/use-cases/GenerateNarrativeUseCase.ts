/**
 * GenerateNarrativeUseCase (Feature 1)
 * Orchestrates land intelligence narrative generation
 */

import type { IDistrictRepository } from '../ports/IDistrictRepository.js';
import type { IAiService } from '../ports/IAiService.js';
import { ScoreCalculator } from '../../domain/services/ScoreCalculator.js';
import type { DistrictScoresData } from '../../domain/value-objects/HealthScore.js';
import { AppError } from '../../domain/errors/AppError.js';

export interface GenerateNarrativeResult {
  district_id: string;
  narrative: string;
  scores: DistrictScoresData;
  generated_at: string;
}

export class GenerateNarrativeUseCase {
  constructor(
    private readonly districtRepo: IDistrictRepository,
    private readonly aiService: IAiService,
    private readonly scoreCalculator: ScoreCalculator
  ) {}

  async execute(districtId: string): Promise<GenerateNarrativeResult> {
    // Fetch district
    const district = await this.districtRepo.findById(districtId);

    if (!district) {
      throw AppError.notFound(`District with ID '${districtId}'`, {
        district_id: districtId,
        valid_ids: this.districtRepo.getValidIds(),
      });
    }

    // Calculate scores
    const landIntel = district.feature_1_land_intelligence;
    const scores = this.scoreCalculator.calculateAllScores(
      landIntel.geography,
      landIntel.water,
      landIntel.climate,
      landIntel.current_status
    );

    // Generate narrative using AI service
    let narrative: string;

    if (this.aiService.isAvailable(1)) {
      narrative = await this.aiService.generateNarrative({ district, scores });
    } else {
      // Fallback narrative when AI is not available
      narrative = this.generateFallbackNarrative(district, scores);
    }

    return {
      district_id: district.district_id,
      narrative,
      scores: {
        soil: scores.soil.toJSON(),
        water: scores.water.toJSON(),
        climate: scores.climate.toJSON(),
        crop: scores.crop.toJSON(),
        overall: scores.overall.toJSON(),
      },
      generated_at: new Date().toISOString(),
    };
  }

  private generateFallbackNarrative(
    district: typeof this.districtRepo extends IDistrictRepository ? Awaited<ReturnType<IDistrictRepository['findById']>> : never,
    scores: ReturnType<ScoreCalculator['calculateAllScores']>
  ): string {
    if (!district) return '';

    const overall = scores.overall;
    const water = scores.water;
    const landIntel = district.feature_1_land_intelligence;

    const statusWord = overall.isCritical ? 'critical' : overall.isWarning ? 'concerning' : 'stable';
    const waterStatus = water.isCritical ? 'severe water stress' : water.isWarning ? 'moderate water concerns' : 'adequate water availability';

    return `${district.name} district in ${district.state} shows ${statusWord} agricultural health with an overall score of ${overall.value}/100. ` +
      `The region faces ${waterStatus}, with groundwater at ${landIntel.water.groundwater_depth_m}m depth and approximately ${landIntel.water.years_until_bankruptcy} years until aquifer depletion. ` +
      `Current ${landIntel.current_status.dominant_crop} cultivation shows ${landIntel.current_status.land_degradation_status} land degradation, requiring immediate attention to sustainable practices.`;
  }
}
