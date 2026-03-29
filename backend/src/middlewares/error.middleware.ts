import { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

type HandledError = Error & {
  statusCode?: number;
};

export const errorHandler = (
  error: HandledError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next;

  const statusCode = error instanceof AppError ? error.statusCode : (error.statusCode ?? 500);
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  logger.error(`${statusCode} - ${error.message}`);

  res.status(statusCode).json({
    success: false,
    message,
  });
};
