import { Request, Response, NextFunction } from 'express';
import { findUserByEmail, createUser, findUserById } from '../models/user.model';
import { hashPassword, comparePassword, signToken } from '../utils/crypto';
import { sendSuccess, sendError } from '../utils/response';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      sendError(res, 'Name is required', 400);
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      sendError(res, 'Valid email is required', 400);
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      sendError(res, 'Password must be at least 6 characters', 400);
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      sendError(res, 'An account with this email already exists', 409);
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(name, email, passwordHash);

    const token = signToken({ id: user.id, email: user.email });

    sendSuccess(
      res,
      {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
      'Account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const token = signToken({ id: user.id, email: user.email });

    sendSuccess(
      res,
      {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const user = await findUserById(userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, {
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};
