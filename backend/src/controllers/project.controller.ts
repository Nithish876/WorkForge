import { Request, Response, NextFunction } from 'express';
import {
  findProjects,
  findProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../models/project.model';
import { findClientById } from '../models/client.model';
import { fetchGitHubCommits } from '../utils/github';
import { sendSuccess, sendError } from '../utils/response';

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const clientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;
    const projects = await findProjects(userId, clientId);
    sendSuccess(res, projects);
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const project = await findProjectById(id);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
};

export const createNewProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { client_id, title, description, github_repo, status, deadline } = req.body;

    if (!client_id) {
      sendError(res, 'client_id is required', 400);
      return;
    }

    const client = await findClientById(parseInt(client_id, 10));
    if (!client || client.user_id !== userId) {
      sendError(res, 'Invalid client or permission denied', 403);
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      sendError(res, 'Project title is required', 400);
      return;
    }

    const project = await createProject({
      client_id: parseInt(client_id, 10),
      title,
      description,
      github_repo,
      status,
      deadline,
    });

    sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateExistingProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const existing = await findProjectById(id);
    if (!existing) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const updated = await updateProject(id, req.body);
    sendSuccess(res, updated, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteExistingProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const existing = await findProjectById(id);
    if (!existing) {
      sendError(res, 'Project not found', 404);
      return;
    }

    await deleteProject(id);
    sendSuccess(res, { id }, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getProjectCommits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const project = await findProjectById(id);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    if (!project.github_repo) {
      sendSuccess(res, [], 'No GitHub repository configured for this project');
      return;
    }

    const commits = await fetchGitHubCommits(project.github_repo);
    sendSuccess(res, commits);
  } catch (error) {
    next(error);
  }
};
