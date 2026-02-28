import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../../../domain/errors/AppError.js';
import { logger } from '../../../infrastructure/logging/logger.js';

export async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.requestId || 'unknown';

    if (error instanceof AppError) {
      logger.warn({
        requestId,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        path: request.url,
        method: request.method,
      }, 'Application error');

      return reply.status(error.statusCode).send(error.toJSON());
    }

    // Handle Fastify validation errors
    if (error.validation) {
      logger.warn({
        requestId,
        validation: error.validation,
        path: request.url,
        method: request.method,
      }, 'Validation error');

      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          statusCode: 400,
          details: { validation: error.validation },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Handle unexpected errors
    logger.error({
      requestId,
      err: error,
      path: request.url,
      method: request.method,
    }, 'Unexpected error');

    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
    });
  });
}
