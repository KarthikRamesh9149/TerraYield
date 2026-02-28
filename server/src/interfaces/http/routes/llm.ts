/**
 * LLM Routes
 * POST /api/llm/feature1-narrative - Generate land intelligence narrative
 * POST /api/llm/feature2-why - Generate crop recommendation explanation
 * POST /api/llm/feature3-brief - Generate policy cabinet brief
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Container } from '../../../container.js';
import { logger } from '../../../infrastructure/logging/logger.js';

const LlmRequestSchema = z.object({
  district_id: z.string().min(1, 'district_id is required'),
});

interface LlmRequestBody {
  district_id: string;
}

export function createLlmRoutes(container: Container) {
  return async function llmRoutes(fastify: FastifyInstance): Promise<void> {
    // Feature 1: Land Intelligence Narrative
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature1-narrative', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate body
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid feature1 request');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        district_id,
        feature: 'feature1-narrative',
      }, 'Generating narrative');

      const result = await container.generateNarrativeUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        duration,
      }, 'Narrative generated');

      return reply.send(result);
    });

    // Feature 2: Crop Matchmaker "Why this fits"
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature2-why', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate body
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid feature2 request');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        district_id,
        feature: 'feature2-why',
      }, 'Generating crop explanation');

      const result = await container.generateCropWhyUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        duration,
      }, 'Crop explanation generated');

      return reply.send(result);
    });

    // Feature 3: Policy Simulator Cabinet Brief
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature3-brief', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      const startTime = Date.now();

      // Validate body
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        logger.warn({
          requestId: request.requestId,
          errors: parseResult.error.errors,
        }, 'Invalid feature3 request');

        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;

      logger.info({
        requestId: request.requestId,
        district_id,
        feature: 'feature3-brief',
      }, 'Generating policy brief');

      const result = await container.generatePolicyBriefUseCase.execute(district_id);

      const duration = Date.now() - startTime;
      logger.info({
        requestId: request.requestId,
        district_id,
        duration,
      }, 'Policy brief generated');

      return reply.send(result);
    });

    // Feature 3: Policy Simulator Polish (optional enhancement)
    fastify.post<{
      Body: LlmRequestBody;
    }>('/llm/feature3-polish', async (request: FastifyRequest<{ Body: LlmRequestBody }>, reply: FastifyReply) => {
      // For now, polish just returns the same as brief
      // In future, this could use a different model or prompt for refinement
      const parseResult = LlmRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.errors,
          },
        });
      }

      const { district_id } = parseResult.data;
      const result = await container.generatePolicyBriefUseCase.execute(district_id);
      return reply.send(result);
    });
  };
}
