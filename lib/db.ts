import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
// The `/web` entry is the HTTP-only libSQL client: no native bindings, which is
// the reliable choice on Vercel's serverless runtime. It speaks to remote Turso
// (libsql://) over HTTPS just fine.
import { createClient } from "@libsql/client/web";

// Reuse a single PrismaClient across hot-reloads in dev to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    // Production / Turso: talk to libSQL over the Prisma driver adapter.
    const libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  // Local dev: use the SQLite file from DATABASE_URL (file:./dev.db).
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
