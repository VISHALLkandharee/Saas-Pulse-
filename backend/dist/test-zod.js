"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
const zod_1 = require("zod");
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
const result = exports.registerSchema.safeParse({});
if (!result.success) {
    console.log(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    const flattenedErrors = result.error.flatten().fieldErrors;
    const firstError = Object.values(flattenedErrors).flat()[0] || "Validation error";
    console.log("FIRST ERROR:", firstError);
}
