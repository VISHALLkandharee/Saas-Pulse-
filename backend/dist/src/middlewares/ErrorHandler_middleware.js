"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const errorHandlerMiddleware = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || "internal server error";
    //  Zod Validation Errors (400)
    if (err instanceof zod_1.ZodError) {
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
exports.default = errorHandlerMiddleware;
