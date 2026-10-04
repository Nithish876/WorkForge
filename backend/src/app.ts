import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/error.middleware';

export const createApp = (): Express => {
  const app = express();

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
