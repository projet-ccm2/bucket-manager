import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  logger.error("Error in middleware", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = (err as any).statusCode || 500;
  let defaultMessage = "Internal server error";
  if (statusCode === 404) defaultMessage = "Not found";
  else if (statusCode === 400) defaultMessage = "Bad request";
  const message = err.message || defaultMessage;

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
  });
}
