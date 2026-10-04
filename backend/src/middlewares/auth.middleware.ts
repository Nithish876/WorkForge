import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/crypto';
import { findUserById } from '../models/user.model';
import { sendError } from '../utils/response';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token missing or invalid', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken<{ id: number; email: string }>(token);

  if (!payload || !payload.id) {
    sendError(res, 'Invalid or expired token', 401);
    return;
  }

  const user = await findUserById(payload.id);
  if (!user) {
    sendError(res, 'User not found or deactivated', 401);
    return;
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  next();
};
