import { Request, Response, NextFunction } from 'express';
import {
  findUserProfile,
  updateUserProfile,
  searchUsers,
  findUserById,
} from '../models/user.model';
import { sendSuccess, sendError } from '../utils/response';

export const getCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await findUserProfile(userId, userId);

    if (!profile) {
      sendError(res, 'User profile not found', 404);
      return;
    }

    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

export const getPublicUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    const requestingUserId = req.user?.id;

    if (isNaN(userId)) {
      sendError(res, 'Invalid user ID', 400);
      return;
    }

    const profile = await findUserProfile(userId, requestingUserId);
    if (!profile) {
      sendError(res, 'User profile not found', 404);
      return;
    }

    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      headline,
      bio,
      location,
      website,
      github_username,
      twitter_username,
      linkedin_url,
      avatar_url,
    } = req.body;

    await updateUserProfile(userId, {
      name,
      headline,
      bio,
      location,
      website,
      github_username,
      twitter_username,
      linkedin_url,
      avatar_url,
    });

    const updatedProfile = await findUserProfile(userId, userId);
    sendSuccess(res, updatedProfile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const searchUsersList = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    const currentUserId = req.user?.id;
    const results = await searchUsers(query, currentUserId);
    sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
};
