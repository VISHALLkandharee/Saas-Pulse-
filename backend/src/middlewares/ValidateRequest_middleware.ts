import { z, ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateSchema =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const flattenedErrors = result.error.flatten().fieldErrors;
      const firstError = Object.values(flattenedErrors).flat()[0] || "Validation error";
      
      return res.status(400).json({
        message: firstError,
        errors: flattenedErrors,
      });
    }
    req.body = result.data; 
    next();
  };

const username = z
  .string()
  .min(2, { message: "Name must be at least 2 characters long" })
  .max(100, { message: "Name must be at most 100 characters long" })
  .regex(/^[a-zA-Z0-9_ ]+$/, {
    message: "Name can only contain letters, numbers, underscores, and spaces",
  });

export const registerSchema = z.object({
  name: username,
  email: z.string().email({ message: "Invalid email address" }), 
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  adminId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

export const waitlistSchema = z.object({
  email: z.string().email({ message: "Join our waitlist with a valid email!" }),
});