import { Router } from 'express';
import {
  getTasks,
  createNewTask,
  updateExistingTask,
  moveTask,
  reorderTasks,
  deleteExistingTask,
  uploadTaskImage,
  serveTaskImage,
} from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadTaskImageMiddleware } from '../middlewares/upload.middleware';

export const taskRouter = Router();

// Public route to serve task attachment images (so they display on Kanban and Client Portal)
taskRouter.get('/images/:filename', serveTaskImage);

// Authenticated routes
taskRouter.use(authenticate);

taskRouter.get('/', getTasks);
taskRouter.post('/', createNewTask);
taskRouter.post('/upload-image', uploadTaskImageMiddleware.single('image'), uploadTaskImage);
taskRouter.post('/:id/image', uploadTaskImageMiddleware.single('image'), uploadTaskImage);
taskRouter.patch('/reorder', reorderTasks);
taskRouter.patch('/:id/move', moveTask);
taskRouter.patch('/:id', updateExistingTask);
taskRouter.put('/:id', updateExistingTask);
taskRouter.delete('/:id', deleteExistingTask);
