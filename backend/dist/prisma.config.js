"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
console.log("[PRISMA_CONFIG] URL loaded from env:", process.env["DATABASE_URL"] ? "YES" : "NO");
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env["DIRECT_URL"],
    },
});
