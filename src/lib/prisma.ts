import { PrismaClient } from "@prisma/client";

// Singleton Prisma client to avoid exhausting connections in dev hot-reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown so pooled connections are released before the process exits.
if (process.env.NODE_ENV !== "test") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
