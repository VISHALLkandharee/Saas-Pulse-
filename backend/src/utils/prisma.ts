import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error("DATABASE_URL is required to connect to PostgreSQL");
}

// node-postgres gives SSL query parameters in the URL precedence over the
// `ssl` object. Remove them before creating the pool so the policy below is
// applied consistently (and `sslrootcert` can be supplied via the CA env var).
const databaseUrl = new URL(rawConnectionString);
const requestedSslMode = databaseUrl.searchParams.get("sslmode")?.toLowerCase();
for (const option of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
  databaseUrl.searchParams.delete(option);
}

const databaseCa = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
const databaseSsl = databaseCa
  ? { ca: databaseCa, rejectUnauthorized: true }
  : {
      // `require` means encrypted transport without certificate identity
      // verification, matching the explicit libpq URL mode. All other modes
      // verify the server certificate and require DATABASE_CA_CERT for a
      // private/self-signed database CA.
      rejectUnauthorized: requestedSslMode === "require" || requestedSslMode === "no-verify"
        ? false
        : true,
    };

const pool = new Pool({
  connectionString: databaseUrl.toString(),
  ssl: databaseSsl,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // ← This should work!
    log: ["query", "error", "warn"],
  });

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
