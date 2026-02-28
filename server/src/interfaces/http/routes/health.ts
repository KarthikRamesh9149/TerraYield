import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../../infrastructure/logging/logger.js';

const startTime = Date.now();
const version = '1.0.0';

interface HealthResponse {
  ok: boolean;
  version: string;
  uptime: number;
  timestamp: string;
}

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Reply: HealthResponse;
  }>('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    logger.debug({
      requestId: request.requestId,
      uptime: uptimeSeconds,
    }, 'Health check requested');

    return reply.send({
      ok: true,
      version,
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
    });
  });
}
