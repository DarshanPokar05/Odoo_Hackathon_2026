import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  message: string = 'Operation completed successfully.',
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  errorCode: string,
  errors?: unknown[],
  statusCode: number = 500,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
  });
};
