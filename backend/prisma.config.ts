import "dotenv/config";
import { defineConfig } from "prisma/config";

console.log("[PRISMA_CONFIG] URL loaded from env:", process.env["DATABASE_URL"] ? "YES" : "NO");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
