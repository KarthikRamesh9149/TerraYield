/**
 * Route Registration
 * Registers all API routes with dependency injection
 */

import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { createHotspotsRoutes } from './hotspots.js';
import { createDistrictsRoutes } from './districts.js';
import { createLlmRoutes } from './llm.js';
import { createCropsRoutes } from './crops.js';
import type { Container } from '../../../container.js';

export function createRegisterRoutes(container: Container) {
  return async function registerRoutes(fastify: FastifyInstance): Promise<void> {
    // Register all route modules under /api prefix
    await fastify.register(async (api) => {
      // Health route doesn't need container
      await api.register(healthRoutes);

      // Routes with dependency injection
      await api.register(createHotspotsRoutes(container));
      await api.register(createDistrictsRoutes(container));
      await api.register(createLlmRoutes(container));
      await api.register(createCropsRoutes(container));
    }, { prefix: '/api' });
  };
}
