import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  findTasksByProjectId,
  findTaskById,
  createTask,
  updateTask,
  updateTaskMovement,
  reorderTasksBatch,
  deleteTask,
} from '../models/task.model';
import { findProjectById } from '../models/project.model';
import { sendSuccess, sendError } from '../utils/response';
import { TaskStatus } from '../types';
import { getTaskImagesRoot } from '../middlewares/upload.middleware';

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawProjectId = req.params.projectId || (req.query.projectId as string);
    const projectId = parseInt(rawProjectId, 10);

    if (isNaN(projectId)) {
      sendError(res, 'Valid project ID is required', 400);
      return;
    }

    const tasks = await findTasksByProjectId(projectId, false);
    sendSuccess(res, tasks);
  } catch (error) {
    next(error);
  }
};

export const createNewTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawProjectId = req.params.projectId || req.body.project_id;
    const projectId = parseInt(rawProjectId, 10);

    if (isNaN(projectId)) {
      sendError(res, 'Valid project ID is required', 400);
      return;
    }

    const project = await findProjectById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const {
      title,
      description,
      status,
      priority,
      sort_order,
      is_client_visible,
      due_date,
      image_url,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      sendError(res, 'Task title is required', 400);
      return;
    }

    const task = await createTask({
      project_id: projectId,
      title,
      description,
      status,
      priority,
      sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : 0,
      is_client_visible: is_client_visible !== undefined ? Boolean(is_client_visible) : true,
      due_date,
      image_url,
    });

    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateExistingTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid task ID', 400);
      return;
    }

    const existing = await findTaskById(id);
    if (!existing) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const updated = await updateTask(id, req.body);
    sendSuccess(res, updated, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadTaskImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No image file was uploaded', 400);
      return;
    }

    const filename = req.file.filename;
    const imageUrl = `/api/tasks/images/${filename}`;

    if (req.params.id) {
      const id = parseInt(req.params.id, 10);
      if (!isNaN(id)) {
        await updateTask(id, { image_url: imageUrl });
      }
    }

    sendSuccess(
      res,
      {
        image_url: imageUrl,
        filename,
        original_name: req.file.originalname,
        size: req.file.size,
      },
      'Task image uploaded successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const serveTaskImage = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(getTaskImagesRoot(), filename);
  if (!fs.existsSync(filePath)) {
    sendError(res, 'Image not found', 404);
    return;
  }
  res.sendFile(filePath);
};

export const moveTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid task ID', 400);
      return;
    }

    const { newStatus, newSortOrder, status, sort_order } = req.body;
    const targetStatus = (newStatus || status) as TaskStatus;
    const targetSortOrder = typeof newSortOrder === 'number' ? newSortOrder : typeof sort_order === 'number' ? sort_order : 0;

    const existing = await findTaskById(id);
    if (!existing) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const updated = await updateTaskMovement(id, targetStatus, targetSortOrder);
    sendSuccess(res, updated, 'Task moved successfully');
  } catch (error) {
    next(error);
  }
};

export const reorderTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      sendError(res, 'items must be an array of { id, status, sort_order }', 400);
      return;
    }

    await reorderTasksBatch(items);
    sendSuccess(res, null, 'Tasks reordered successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteExistingTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid task ID', 400);
      return;
    }

    const existing = await findTaskById(id);
    if (!existing) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // If task had an image on disk, clean it up safely
    if (existing.image_url && existing.image_url.startsWith('/api/tasks/images/')) {
      const filename = path.basename(existing.image_url);
      const filePath = path.join(getTaskImagesRoot(), filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore
        }
      }
    }

    await deleteTask(id);
    sendSuccess(res, { id }, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};
