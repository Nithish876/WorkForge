import { Request, Response, NextFunction } from 'express';
import {
  findProjectCollaborators,
  addProjectCollaborator,
  removeProjectCollaborator,
  updateProjectCollaboratorRole,
} from '../models/collaborator.model';
import { findProjectById } from '../models/project.model';
import { findUserByEmail, findUserById, createUser } from '../models/user.model';
import { hashPassword } from '../utils/crypto';
import { sendSuccess, sendError } from '../utils/response';

export const getProjectCollaboratorsList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const project = await findProjectById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const collaborators = await findProjectCollaborators(projectId);
    const owner = await findUserById(project.user_id || 1);

    sendSuccess(res, {
      project_id: projectId,
      owner: owner ? {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        headline: owner.headline,
        avatar_url: owner.avatar_url,
      } : null,
      collaborators,
    });
  } catch (error) {
    next(error);
  }
};

export const inviteCollaboratorToProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const currentUserId = req.user!.id;
    const { email, name, role } = req.body;

    if (isNaN(projectId)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const project = await findProjectById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    // Owner check: Only project owner can invite collaborators
    if (project.user_id && project.user_id !== currentUserId) {
      sendError(res, 'Only project owners have permission to invite collaborators', 403);
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      sendError(res, 'A valid collaborator email is required', 400);
      return;
    }

    const targetEmail = email.trim().toLowerCase();

    // Check if user is trying to invite themselves
    if (req.user!.email.toLowerCase() === targetEmail) {
      sendError(res, 'You are already the owner of this project', 400);
      return;
    }

    // Find or create user
    let user = await findUserByEmail(targetEmail);
    if (!user) {
      const defaultPassword = 'Collaborator2025!';
      const passwordHash = await hashPassword(defaultPassword);
      const userName = name && typeof name === 'string' && name.trim().length > 0
        ? name.trim()
        : targetEmail.split('@')[0];
      user = await createUser(userName, targetEmail, passwordHash);
    }

    const collabRole = role === 'viewer' ? 'viewer' : 'contributor';
    const collaborator = await addProjectCollaborator({
      project_id: projectId,
      user_id: user.id,
      role: collabRole,
      status: 'accepted',
      invited_by: currentUserId,
    });

    sendSuccess(res, collaborator, `Successfully invited ${user.name} as ${collabRole}`, 201);
  } catch (error) {
    next(error);
  }
};

export const removeCollaboratorFromProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const currentUserId = req.user!.id;

    if (isNaN(projectId) || isNaN(targetUserId)) {
      sendError(res, 'Invalid project or user ID', 400);
      return;
    }

    const project = await findProjectById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    // Only owner can remove collaborators (or user removing themselves)
    const isOwner = project.user_id === currentUserId;
    const isSelf = targetUserId === currentUserId;

    if (!isOwner && !isSelf) {
      sendError(res, 'Permission denied: only owner can remove team members', 403);
      return;
    }

    await removeProjectCollaborator(projectId, targetUserId);
    sendSuccess(res, { project_id: projectId, user_id: targetUserId }, 'Collaborator removed successfully');
  } catch (error) {
    next(error);
  }
};

export const updateCollaboratorRoleInProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const currentUserId = req.user!.id;
    const { role } = req.body;

    if (isNaN(projectId) || isNaN(targetUserId)) {
      sendError(res, 'Invalid project or user ID', 400);
      return;
    }

    const project = await findProjectById(projectId);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    if (project.user_id !== currentUserId) {
      sendError(res, 'Only project owner can update collaborator permissions', 403);
      return;
    }

    const collabRole = role === 'viewer' ? 'viewer' : 'contributor';
    await updateProjectCollaboratorRole(projectId, targetUserId, collabRole);
    sendSuccess(res, { project_id: projectId, user_id: targetUserId, role: collabRole }, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
};
