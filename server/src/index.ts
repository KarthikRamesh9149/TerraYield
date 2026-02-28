import { buildApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './infrastructure/logging/logger.js';

async function main(): Promise<void> {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info({
      port: config.port,
      env: config.nodeEnv,
    }, `Server started successfully on port ${config.port}`);

    // Graceful shutdown handlers
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info({ signal }, 'Received shutdown signal');

        try {
          await app.close();
          logger.info('Server closed gracefully');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during shutdown');
          process.exit(1);
        }
      });
    });

  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
