/**
 * Dependency Injection Container
 * Creates and wires all application dependencies
 */

import type { Config } from './config/index.js';
import { ScoreCalculator } from './domain/services/ScoreCalculator.js';
import { CropMatcher } from './domain/services/CropMatcher.js';
import { FileDistrictRepository } from './infrastructure/repositories/FileDistrictRepository.js';
import { FileHotspotsRepository } from './infrastructure/repositories/FileHotspotsRepository.js';
import { FileCropRepository } from './infrastructure/repositories/FileCropRepository.js';
import { MistralClient } from './infrastructure/ai/MistralClient.js';
import { MistralAiService } from './infrastructure/ai/MistralAiService.js';
import { GetDistrictUseCase } from './application/use-cases/GetDistrictUseCase.js';
import { GetHotspotsUseCase } from './application/use-cases/GetHotspotsUseCase.js';
import { GenerateNarrativeUseCase } from './application/use-cases/GenerateNarrativeUseCase.js';
import { GenerateCropWhyUseCase } from './application/use-cases/GenerateCropWhyUseCase.js';
import { GeneratePolicyBriefUseCase } from './application/use-cases/GeneratePolicyBriefUseCase.js';
import { GetCropRecommendationsUseCase } from './application/use-cases/GetCropRecommendationsUseCase.js';
import type { IDistrictRepository } from './application/ports/IDistrictRepository.js';
import type { IHotspotsRepository } from './application/ports/IHotspotsRepository.js';
import type { ICropRepository } from './application/ports/ICropRepository.js';
import type { IAiService } from './application/ports/IAiService.js';

export interface Container {
  // Repositories
  districtRepo: IDistrictRepository;
  hotspotsRepo: IHotspotsRepository;
  cropRepo: ICropRepository;

  // Services
  aiService: IAiService;
  scoreCalculator: ScoreCalculator;
  cropMatcher: CropMatcher;

  // Use Cases
  getDistrictUseCase: GetDistrictUseCase;
  getHotspotsUseCase: GetHotspotsUseCase;
  generateNarrativeUseCase: GenerateNarrativeUseCase;
  generateCropWhyUseCase: GenerateCropWhyUseCase;
  generatePolicyBriefUseCase: GeneratePolicyBriefUseCase;
  getCropRecommendationsUseCase: GetCropRecommendationsUseCase;
}

export function createContainer(config: Config): Container {
  // Infrastructure
  const districtRepo = new FileDistrictRepository();
  const hotspotsRepo = new FileHotspotsRepository();
  const cropRepo = new FileCropRepository();
  const mistralClient = new MistralClient(config.mistral);
  const aiService = new MistralAiService(mistralClient, config.mistral);

  // Domain Services
  const scoreCalculator = new ScoreCalculator();
  const cropMatcher = new CropMatcher();

  // Use Cases
  const getDistrictUseCase = new GetDistrictUseCase(districtRepo, scoreCalculator);
  const getHotspotsUseCase = new GetHotspotsUseCase(hotspotsRepo);
  const generateNarrativeUseCase = new GenerateNarrativeUseCase(
    districtRepo,
    aiService,
    scoreCalculator
  );
  const generateCropWhyUseCase = new GenerateCropWhyUseCase(districtRepo, aiService);
  const generatePolicyBriefUseCase = new GeneratePolicyBriefUseCase(districtRepo, aiService);
  const getCropRecommendationsUseCase = new GetCropRecommendationsUseCase(
    districtRepo,
    cropRepo,
    cropMatcher
  );

  return {
    districtRepo,
    hotspotsRepo,
    cropRepo,
    aiService,
    scoreCalculator,
    cropMatcher,
    getDistrictUseCase,
    getHotspotsUseCase,
    generateNarrativeUseCase,
    generateCropWhyUseCase,
    generatePolicyBriefUseCase,
    getCropRecommendationsUseCase,
  };
}
