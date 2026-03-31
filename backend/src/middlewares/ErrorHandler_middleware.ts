import { success, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

interface customError extends Error {
  status?: number;
}

const errorHandlerMiddleware = (
  err: customError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || 500;
  const message = err.message || "internal server error";

  //  Zod Validation Errors (400)
  if (err instanceof ZodError) {
    const flattenedErrors = err.flatten().fieldErrors;
    const firstError = Object.values(flattenedErrors).flat()[0] || "Validation Error";
    return res.status(400).json({
      success: false,
      message: firstError,
      errors: flattenedErrors,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};


export default errorHandlerMiddleware;