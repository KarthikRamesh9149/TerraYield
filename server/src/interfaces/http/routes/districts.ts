/**
 * Districts Routes
 * GET /api/districts/:district_id - Get district with calculated scores
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Container } from '../../../container.js';
import { logger } from '../../../infrastructure/logging/logger.js';

interface DistrictParams {
  district_id: string;
}

const DistrictParamsSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

export function createDistrictsRoutes(container: Container) {
  return async function districtsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{
      Params: DistrictParams;
    }>('/districts/:district_id', async (request: FastifyRequest<{ Params: DistrictParams }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate params
      const parseResult = DistrictParamsSchema.safeParse(request.params);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid district params');

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
      }, 'Fetching district');

      const result = await container.getDistrictUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        duration,
      }, 'District fetched successfully');

      return reply.send(result);
    });
  };
}
