import { Router } from 'express';
import {
  getTasks,
  createNewTask,
  updateExistingTask,
  moveTask,
  reorderTasks,
  deleteExistingTask,
} from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.get('/', getTasks);
taskRouter.post('/', createNewTask);
taskRouter.patch('/reorder', reorderTasks);
taskRouter.patch('/:id/move', moveTask);
taskRouter.patch('/:id', updateExistingTask);
taskRouter.put('/:id', updateExistingTask);
taskRouter.delete('/:id', deleteExistingTask);
