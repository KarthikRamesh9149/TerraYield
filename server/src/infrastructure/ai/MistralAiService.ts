/**
 * MistralAiService
 * Implements IAiService using Mistral API
 */

import type { IAiService, NarrativeContext, CropContext, PolicyContext } from '../../application/ports/IAiService.js';
import { MistralClient, type MistralConfig } from './MistralClient.js';
import { buildNarrativePrompt } from './prompts/feature1Narrative.js';
import { buildCropWhyPrompt } from './prompts/feature2Why.js';
import { buildPolicyBriefPrompt } from './prompts/feature3Brief.js';
import { logger } from '../logging/logger.js';

export class MistralAiService implements IAiService {
  private readonly client: MistralClient;
  private readonly config: MistralConfig;

  constructor(client: MistralClient, config: MistralConfig) {
    this.client = client;
    this.config = config;
  }

  isAvailable(feature: 1 | 2 | 3): boolean {
    switch (feature) {
      case 1:
        return this.client.hasKey('feature1');
      case 2:
        return this.client.hasKey('feature2');
      case 3:
        return this.client.hasKey('feature3');
      default:
        return false;
    }
  }

  async generateNarrative(context: NarrativeContext): Promise<string> {
    const { district, scores } = context;

    logger.info({
      feature: 'feature1',
      district_id: district.district_id,
    }, 'Generating land intelligence narrative');

    try {
      const messages = buildNarrativePrompt(district, scores);
      const response = await this.client.chat('feature1', messages, {
        temperature: 0.7,
        maxTokens: 256,
      });

      logger.info({
        feature: 'feature1',
        district_id: district.district_id,
        responseLength: response.length,
      }, 'Narrative generated successfully');

      return response.trim();
    } catch (error) {
      logger.error({
        feature: 'feature1',
        district_id: district.district_id,
        error: (error as Error).message,
      }, 'Failed to generate narrative');

      throw error;
    }
  }

  async generateCropWhy(context: CropContext): Promise<string> {
    const { district } = context;

    logger.info({
      feature: 'feature2',
      district_id: district.district_id,
    }, 'Generating crop recommendation explanation');

    try {
      const messages = buildCropWhyPrompt(district);
      const response = await this.client.chat('feature2', messages, {
        temperature: 0.7,
        maxTokens: 512,
      });

      logger.info({
        feature: 'feature2',
        district_id: district.district_id,
        responseLength: response.length,
      }, 'Crop explanation generated successfully');

      return response.trim();
    } catch (error) {
      logger.error({
        feature: 'feature2',
        district_id: district.district_id,
        error: (error as Error).message,
      }, 'Failed to generate crop explanation');

      throw error;
    }
  }

  async generatePolicyBrief(context: PolicyContext): Promise<string> {
    const { district } = context;

    logger.info({
      feature: 'feature3',
      district_id: district.district_id,
    }, 'Generating policy cabinet brief');

    try {
      const messages = buildPolicyBriefPrompt(district);
      const response = await this.client.chat('feature3', messages, {
        temperature: 0.6, // Slightly lower for more formal output
        maxTokens: 1024,
      });

      logger.info({
        feature: 'feature3',
        district_id: district.district_id,
        responseLength: response.length,
      }, 'Policy brief generated successfully');

      return response.trim();
    } catch (error) {
      logger.error({
        feature: 'feature3',
        district_id: district.district_id,
        error: (error as Error).message,
      }, 'Failed to generate policy brief');

      throw error;
    }
  }
}
