/**
 * Crops Routes
 * GET /api/crops/recommendations/:district_id - Get crop recommendations for a district
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Container } from '../../../container.js';
import { logger } from '../../../infrastructure/logging/logger.js';

interface CropRecommendationsParams {
  district_id: string;
}

const CropRecommendationsParamsSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

export function createCropsRoutes(container: Container) {
  return async function cropsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{
      Params: CropRecommendationsParams;
    }>('/crops/recommendations/:district_id', async (request: FastifyRequest<{ Params: CropRecommendationsParams }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate params
      const parseResult = CropRecommendationsParamsSchema.safeParse(request.params);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid crop recommendations params');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        district_id,
      }, 'Fetching crop recommendations');

      const result = await container.getCropRecommendationsUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        topCropsCount: result.top_crops.length,
        duration,
      }, 'Crop recommendations fetched successfully');

      return reply.send(result);
    });
  };
}
