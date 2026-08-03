import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Reuse a single client across dev-server (tsx watch) restarts / module
// reloads, so we don't exhaust Postgres connections.
export const prisma: PrismaClient = global.__prisma ?? new PrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  global.__prisma = prisma;
}
