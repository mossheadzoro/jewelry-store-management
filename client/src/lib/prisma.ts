// client/src/lib/prisma.ts
import { PrismaClient } from "../generated/client";

export * from "../generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma_v4: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma_v4 ??
  new PrismaClient({
    log: [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v4 = prisma;
