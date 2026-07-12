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
    req.user = decoded as jwt.JwtPayload & { id: string; role: string };
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};

export const authorize = (...requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (!requiredRoles.includes(req.user.role) && req.user.role !== 'ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
      return next(new AuthorizationError(`Requires one of the roles: ${requiredRoles.join(', ')}`));
    }

    next();
  };
};
