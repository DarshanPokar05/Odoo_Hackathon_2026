import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from '../shared/errors/customErrors';

// Extend Express Request to carry the decoded JWT payload
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload & { id: string; role: string };
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Missing or invalid token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key');
    req.user = decoded;
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

export const authorize = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
      return next(new AuthorizationError(`Requires role: ${requiredRole}`));
    }

    next();
  };
};
