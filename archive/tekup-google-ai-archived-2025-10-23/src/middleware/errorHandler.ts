import type { Request, Response, NextFunction } from "express";
import { errorHandler as handleErrors } from "../errors"; // Renamed to avoid conflict
import { logger } from "../logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const { response, statusCode } = handleErrors(err);

  // Log request details for debugging
  logger.error({
    err,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
  });

  res.status(statusCode).json(response);
}
