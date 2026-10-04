import { createApp } from './app';
import { env } from './config/env';
import { initDatabase } from './config/db';

const bootstrap = async (): Promise<void> => {
  try {
    // Functional database initialization
    await initDatabase();

    const app = createApp();

    const server = app.listen(env.port, () => {
      console.log(`[SERVER] Project Management API is running at http://localhost:${env.port}`);
      console.log(`[SERVER] Health check available at http://localhost:${env.port}/api/health`);
    });

    const shutdown = (): void => {
      console.log('[SERVER] Shutting down gracefully...');
      server.close(() => {
        console.log('[SERVER] Closed all active connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[SERVER] Fatal error during startup:', error);
    process.exit(1);
  }
};

bootstrap();
