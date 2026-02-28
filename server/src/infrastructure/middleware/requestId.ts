import { FastifyInstance, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

export async function requestIdPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const existingId = request.headers['x-request-id'];
    request.requestId = typeof existingId === 'string' ? existingId : uuidv4();
  });

  fastify.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.requestId);
  });
}
