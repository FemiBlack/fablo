import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/api';

// Custom error class for API errors
export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const errorResponse: ApiError = {
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    };
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle unknown errors
  const errorResponse: ApiError = {
    error: 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    statusCode: 500,
  };
  res.status(500).json(errorResponse);
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
