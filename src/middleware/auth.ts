import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * Verifies the JWT from the Authorization header and attaches
 * the decoded payload to req.user.
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['authorization'];

  if (!token) {
    sendError({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    sendError({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * Restricts access to users with specific roles.
 * Must be used after authenticate middleware.
 */
export const requireRole = (...roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      sendError({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
};
