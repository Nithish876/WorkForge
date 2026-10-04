import { Request, Response, NextFunction } from 'express';
import { findClientByShareToken } from '../models/client.model';
import { findProjectsByClientId } from '../models/project.model';
import { findTasksByProjectId } from '../models/task.model';
import { findAssetsByProjectId, createAsset } from '../models/asset.model';
import { findUserById } from '../models/user.model';
import { sendSuccess, sendError } from '../utils/response';

export const getPortalData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shareToken } = req.params;

    if (!shareToken || typeof shareToken !== 'string') {
      sendError(res, 'Share token is required', 400);
      return;
    }

    const client = await findClientByShareToken(shareToken);
    if (!client) {
      sendError(res, 'Invalid or expired client portal link', 404);
      return;
    }

    const freelancer = await findUserById(client.user_id);
    const projects = await findProjectsByClientId(client.id);

    const enrichedProjects = await Promise.all(
      projects.map(async (p) => {
        // Only fetch tasks where is_client_visible = true!
        const visibleTasks = await findTasksByProjectId(p.id, true);
        const totalVisible = visibleTasks.length;
        const completedVisible = visibleTasks.filter((t) => t.status === 'done');
        const progressPercentage =
          totalVisible > 0 ? Math.round((completedVisible.length / totalVisible) * 100) : 0;

        const inProgressTasks = visibleTasks.filter((t) => t.status === 'in_progress');
        const reviewTasks = visibleTasks.filter((t) => t.status === 'review');
        const completedTasksList = completedVisible;

        const assets = await findAssetsByProjectId(p.id);
        const assetsWithDownload = assets.map((a) => ({
          ...a,
          download_url: `/api/assets/${a.id}/download?share_token=${shareToken}`,
        }));

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          deadline: p.deadline,
          progressPercentage,
          totalTasks: totalVisible,
          completedTasks: completedVisible.length,
          inProgressTasks,
          reviewTasks,
          completedTasksList,
          assets: assetsWithDownload,
        };
      })
    );

    sendSuccess(res, {
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
      },
      freelancer: {
        name: freelancer ? freelancer.name : 'Your Project Manager',
        email: freelancer ? freelancer.email : '',
      },
      projects: enrichedProjects,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadClientPortalAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shareToken, projectId } = req.params;
    const parsedProjectId = parseInt(projectId, 10);

    if (isNaN(parsedProjectId)) {
      sendError(res, 'Invalid project ID', 400);
      return;
    }

    const client = await findClientByShareToken(shareToken);
    if (!client) {
      sendError(res, 'Invalid share token', 403);
      return;
    }

    // Verify project belongs to this client
    const clientProjects = await findProjectsByClientId(client.id);
    const ownsProject = clientProjects.some((p) => p.id === parsedProjectId);
    if (!ownsProject) {
      sendError(res, 'Project not associated with this client portal', 403);
      return;
    }

    if (!req.file) {
      sendError(res, 'No file was uploaded', 400);
      return;
    }

    const asset = await createAsset({
      project_id: parsedProjectId,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype || 'application/octet-stream',
      uploaded_by: 'client',
    });

    sendSuccess(
      res,
      {
        ...asset,
        download_url: `/api/assets/${asset.id}/download?share_token=${shareToken}`,
      },
      'Deliverable uploaded successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};
