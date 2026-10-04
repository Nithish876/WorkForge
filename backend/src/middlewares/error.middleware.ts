import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[SERVER ERROR]', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';
  sendError(res, message, status);
};
