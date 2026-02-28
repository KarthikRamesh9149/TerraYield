/**
 * Hotspots Routes
 * GET /api/hotspots - Get hotspots GeoJSON with optional filtering
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Container } from '../../../container.js';
import { logger } from '../../../infrastructure/logging/logger.js';

interface HotspotsQuery {
  issue?: 'soil' | 'yield';
}

const HotspotsQuerySchema = z.object({
  issue: z.enum(['soil', 'yield']).optional(),
});

export function createHotspotsRoutes(container: Container) {
  return async function hotspotsRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.get<{
      Querystring: HotspotsQuery;
    }>('/hotspots', async (request: FastifyRequest<{ Querystring: HotspotsQuery }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate query params
      const parseResult = HotspotsQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid hotspots query');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parseResult.error.errors,
          },
        });
      }

      const { issue } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        issue: issue || 'all',
      }, 'Fetching hotspots');

      const result = await container.getHotspotsUseCase.execute({ issue });

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        featureCount: result.features.length,
        duration,
      }, 'Hotspots fetched successfully');

      return reply.send(result);
    });
  };
}
