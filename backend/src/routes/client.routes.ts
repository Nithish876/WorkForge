import { Router } from 'express';
import {
  getClients,
  getClient,
  createNewClient,
  updateExistingClient,
  deleteExistingClient,
} from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const clientRouter = Router();

clientRouter.use(authenticate);

clientRouter.get('/', getClients);
clientRouter.get('/:id', getClient);
clientRouter.post('/', createNewClient);
clientRouter.patch('/:id', updateExistingClient);
clientRouter.put('/:id', updateExistingClient);
clientRouter.delete('/:id', deleteExistingClient);
