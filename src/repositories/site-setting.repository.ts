import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const siteSettingRepository = {
  async findOne(key: string) {
    return prisma.siteSetting.findUnique({ where: { key } });
  },

  async upsert(key: string, value: Prisma.InputJsonValue) {
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  },

  async list() {
    return prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  },
};
