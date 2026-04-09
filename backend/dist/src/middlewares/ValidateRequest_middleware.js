"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitlistSchema = exports.loginSchema = exports.registerSchema = exports.validateSchema = void 0;
const zod_1 = require("zod");
const validateSchema = (schema) => (req, res, next) => {
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
exports.validateSchema = validateSchema;
const username = zod_1.z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name must be at most 100 characters long" })
    .regex(/^[a-zA-Z0-9_ ]+$/, {
    message: "Name can only contain letters, numbers, underscores, and spaces",
});
exports.registerSchema = zod_1.z.object({
    name: username,
    email: zod_1.z.string().email({ message: "Invalid email address" }),
    password: zod_1.z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" }),
    adminId: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email address" }),
    password: zod_1.z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" }),
});
exports.waitlistSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Join our waitlist with a valid email!" }),
});
