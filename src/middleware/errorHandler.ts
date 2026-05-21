import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

// Custom application error class
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Centralized error handler. Catches both sync and async errors.
 * Must be registered AFTER all routes.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('🔥 Error:', err.message);

  if (err instanceof AppError) {
    sendError({
      res,
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  // PostgreSQL unique violation (email already exists)
  if ((err as NodeJS.ErrnoException).code === '23505') {
    sendError({
      res,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'A user with this email already exists.',
    });
    return;
  }

  sendError({
    res,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred. Please try again later.',
    errors: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

/**
 * Wraps async route handlers so errors propagate to errorHandler.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
