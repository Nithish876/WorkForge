import { Router } from 'express';
import {
  getCurrentUserProfile,
  getPublicUserProfile,
  updateCurrentUserProfile,
  searchUsersList,
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const userRouter = Router();

// Public user profile (accessible without login)
userRouter.get('/:id/public', getPublicUserProfile);

// Protected routes (require auth)
userRouter.use(authenticate);
userRouter.get('/profile', getCurrentUserProfile);
userRouter.put('/profile', updateCurrentUserProfile);
userRouter.get('/search', searchUsersList);
