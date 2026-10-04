import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import {
  findAssetsByProjectId,
  findAssetById,
  createAsset,
  deleteAsset,
} from '../models/asset.model';
import { findProjectById } from '../models/project.model';
import { findClientByShareToken } from '../models/client.model';
import { verifyToken } from '../utils/crypto';
import { sendSuccess, sendError } from '../utils/response';

export const getProjectAssets = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawProjectId = req.params.projectId || req.params.id || (req.query.projectId as string);
    const projectId = parseInt(rawProjectId, 10);

    if (isNaN(projectId)) {
      sendError(res, 'Valid project ID is required', 400);
      return;
    }

    const assets = await findAssetsByProjectId(projectId);
    const withUrls = assets.map((a) => ({
      ...a,
      download_url: `/api/assets/${a.id}/download`,
    }));

    sendSuccess(res, withUrls);
  } catch (error) {
    next(error);
  }
};

export const uploadProjectAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawProjectId = req.params.projectId || req.params.id || req.body.project_id;
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

    if (!req.file) {
      sendError(res, 'No file was uploaded', 400);
      return;
    }

    const uploadedBy = req.body.uploaded_by === 'client' ? 'client' : 'freelancer';

    const asset = await createAsset({
      project_id: projectId,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype || 'application/octet-stream',
      uploaded_by: uploadedBy,
    });

    sendSuccess(
      res,
      {
        ...asset,
        download_url: `/api/assets/${asset.id}/download`,
      },
      'Asset uploaded successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const downloadAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid asset ID', 400);
      return;
    }

    const asset = await findAssetById(id);
    if (!asset) {
      sendError(res, 'Asset not found', 404);
      return;
    }

    // Permission check: Bearer token, query token (JWT), or client portal share_token
    let authorized = false;
    const authHeader = req.headers.authorization;
    const queryJwt = req.query.token as string;
    const shareToken = req.query.share_token as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) authorized = true;
    } else if (queryJwt) {
      const payload = verifyToken(queryJwt);
      if (payload) authorized = true;
    } else if (shareToken) {
      const client = await findClientByShareToken(shareToken);
      if (client) {
        const project = await findProjectById(asset.project_id);
        if (project && project.client_id === client.id) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      sendError(res, 'Unauthorized access to asset download', 401);
      return;
    }

    if (!fs.existsSync(asset.file_path)) {
      sendError(res, 'File not found on server disk', 404);
      return;
    }

    res.download(asset.file_path, asset.original_name);
  } catch (error) {
    next(error);
  }
};

export const deleteExistingAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      sendError(res, 'Invalid asset ID', 400);
      return;
    }

    const deleted = await deleteAsset(id);
    if (!deleted) {
      sendError(res, 'Asset not found', 404);
      return;
    }

    // Safely remove file on disk if exists
    try {
      if (fs.existsSync(deleted.file_path)) {
        fs.unlinkSync(deleted.file_path);
      }
    } catch (e) {
      console.warn('[ASSET] File cleanup warning:', e);
    }

    sendSuccess(res, { id }, 'Asset deleted successfully');
  } catch (error) {
    next(error);
  }
};
