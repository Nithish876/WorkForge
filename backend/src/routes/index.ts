import { Router } from 'express';
import { authRouter } from './auth.routes';
import { clientRouter } from './client.routes';
import { projectRouter } from './project.routes';
import { taskRouter } from './task.routes';
import { assetRouter } from './asset.routes';
import { portalRouter } from './portal.routes';
import { userRouter } from './user.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/clients', clientRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/assets', assetRouter);
apiRouter.use('/portal', portalRouter);

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Project Management API',
    architecture: 'Functional MVC',
  });
});
