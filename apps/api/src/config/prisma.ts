import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env["NODE_ENV"] !== "production") {
  global.__prisma = prisma;
}