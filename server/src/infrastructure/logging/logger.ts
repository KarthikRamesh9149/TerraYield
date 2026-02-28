import { pino, type Logger } from 'pino';
import { config } from '../../config/index.js';

const isDevelopment = config.nodeEnv === 'development';

export const logger = pino({
  level: config.logLevel,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    env: config.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}
