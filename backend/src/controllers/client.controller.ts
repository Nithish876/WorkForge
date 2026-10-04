import { Request, Response, NextFunction } from 'express';
import {
  findClientsByUserId,
  findClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../models/client.model';
import { sendSuccess, sendError } from '../utils/response';

export const getClients = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const clients = await findClientsByUserId(userId);
    sendSuccess(res, clients);
  } catch (error) {
    next(error);
  }
};

export const getClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid client ID', 400);
      return;
    }

    const client = await findClientById(id);
    if (!client) {
      sendError(res, 'Client not found', 404);
      return;
    }

    if (client.user_id !== req.user!.id) {
      sendError(res, 'Access denied', 403);
      return;
    }

    sendSuccess(res, client);
  } catch (error) {
    next(error);
  }
};

export const createNewClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, email, company } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      sendError(res, 'Client name is required', 400);
      return;
    }

    const newClient = await createClient(userId, name, email, company);
    sendSuccess(res, newClient, 'Client created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateExistingClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid client ID', 400);
      return;
    }

    const existing = await findClientById(id);
    if (!existing) {
      sendError(res, 'Client not found', 404);
      return;
    }

    if (existing.user_id !== req.user!.id) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const updated = await updateClient(id, req.body);
    sendSuccess(res, updated, 'Client updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteExistingClient = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid client ID', 400);
      return;
    }

    const existing = await findClientById(id);
    if (!existing) {
      sendError(res, 'Client not found', 404);
      return;
    }

    if (existing.user_id !== req.user!.id) {
      sendError(res, 'Access denied', 403);
      return;
    }

    await deleteClient(id);
    sendSuccess(res, { id }, 'Client deleted successfully');
  } catch (error) {
    next(error);
  }
};
