/**
 * Fastify Application Factory
 * Configures and builds the Fastify application with all middleware and routes
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { logger } from './infrastructure/logging/logger.js';
import { requestIdPlugin } from './infrastructure/middleware/requestId.js';
import { errorHandlerPlugin } from './interfaces/http/plugins/errorHandler.js';
import { createRegisterRoutes } from './interfaces/http/routes/index.js';
import { createContainer } from './container.js';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false, // We use our own pino logger
    disableRequestLogging: true,
    bodyLimit: 1048576, // 1mb max body size
  });

  // Initialize dependency injection container
  const container = createContainer(config);
  logger.info('Dependency container initialized');

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
  });

  // Register CORS (environment-aware)
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com']
      : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // Register request ID middleware
  await fastify.register(requestIdPlugin);

  // Register error handler
  await fastify.register(errorHandlerPlugin);

  // Request logging hook
  fastify.addHook('onRequest', async (request) => {
    logger.info({
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
    }, 'Incoming request');
  });

  // Response logging hook
  fastify.addHook('onResponse', async (request, reply) => {
    logger.info({
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'Request completed');
  });

  // Register all routes with container
  const registerRoutes = createRegisterRoutes(container);
  await registerRoutes(fastify);

  return fastify;
}
