import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../shared/errors/customErrors';
import { sendError } from '../shared/responses/apiResponse';
import logger from '../infrastructure/logger';
import { ZodError } from 'zod';

export const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, path: req.path }, err.message);

  if (err instanceof CustomError) {
    return sendError(res, err.message, err.errorCode, err.errors, err.statusCode);
  }

  if (err instanceof ZodError) {
    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', err.errors, 400);
  }

  // Fallback for unexpected errors
  return sendError(res, 'Internal Server Error', 'INTERNAL_SERVER_ERROR', undefined, 500);
};
