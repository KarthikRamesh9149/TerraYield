/**
 * FileCropRepository - Loads crops from JSON files
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ICropRepository, Crop, CompanionRule } from '../../application/ports/ICropRepository.js';
import { logger } from '../logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class FileCropRepository implements ICropRepository {
  private cropsCache: Crop[] | null = null;
  private companionRulesCache: CompanionRule[] | null = null;
  private readonly cropsPath: string;
  private readonly companionRulesPath: string;

  constructor() {
    // Path relative to server directory, pointing to client/public/data
    const basePath = join(__dirname, '..', '..', '..', '..', 'client', 'public', 'data');
    this.cropsPath = join(basePath, 'crops_database.json');
    this.companionRulesPath = join(basePath, 'companion_rules.json');
  }

  async getAllCrops(): Promise<Crop[]> {
    if (this.cropsCache) {
      return this.cropsCache;
    }

    try {
      const content = await readFile(this.cropsPath, 'utf-8');
      this.cropsCache = JSON.parse(content) as Crop[];
      logger.info({ count: this.cropsCache.length }, 'Loaded crops database');
      return this.cropsCache;
    } catch (error) {
      logger.error({ error, path: this.cropsPath }, 'Failed to load crops database');
      throw error;
    }
  }

  async getCompanionRules(): Promise<CompanionRule[]> {
    if (this.companionRulesCache) {
      return this.companionRulesCache;
    }

    try {
      const content = await readFile(this.companionRulesPath, 'utf-8');
      this.companionRulesCache = JSON.parse(content) as CompanionRule[];
      logger.info({ count: this.companionRulesCache.length }, 'Loaded companion rules');
      return this.companionRulesCache;
    } catch (error) {
      logger.error({ error, path: this.companionRulesPath }, 'Failed to load companion rules');
      throw error;
    }
  }

  async findCompanionRule(cropId: string, companionId: string): Promise<CompanionRule | null> {
    const rules = await this.getCompanionRules();
    return (
      rules.find(
        (r) =>
          (r.crop_id === cropId && r.companion_crop_id === companionId) ||
          (r.crop_id === companionId && r.companion_crop_id === cropId)
      ) || null
    );
  }

  async findCropById(cropId: string): Promise<Crop | null> {
    const crops = await this.getAllCrops();
    return crops.find((c) => c.crop_id === cropId) || null;
  }
}
