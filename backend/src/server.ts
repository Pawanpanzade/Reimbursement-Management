import app from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully.`);

  try {
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown shutdown error';
    logger.error(`Shutdown failed: ${message}`);
    process.exit(1);
  }
};

const bootstrap = async (): Promise<void> => {
  try {
    if (env.skipDbConnect) {
      logger.warn('SKIP_DB_CONNECT is enabled. Starting server without database connection.');
    } else {
      await connectDatabase();
      logger.info('Database connected successfully.');
    }

    app.listen(env.port, () => {
      logger.info(`Server started on port ${env.port} in ${env.nodeEnv} mode.`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    logger.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void bootstrap();
