import { prisma } from "@/lib/prisma";
import type { Prisma, PurchaseRequestStatus } from "@prisma/client";

export const purchaseRequestRepository = {
  async create(data: {
    buyerName: string;
    buyerPhone: string;
    buyerEmail?: string | null;
    message?: string | null;
    artworkId: string;
    artistId: string;
  }) {
    return prisma.purchaseRequest.create({
      data,
      include: {
        artwork: { select: { id: true, title: true, image: true } },
        artist: { select: { id: true, name: true } },
      },
    });
  },

  async findById(id: string) {
    return prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        artwork: { select: { id: true, title: true, image: true } },
        artist: { select: { id: true, name: true } },
      },
    });
  },

  async listForAdmin(params: { page: number; limit: number; status?: PurchaseRequestStatus }) {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.PurchaseRequestWhereInput = {};
    if (params.status) where.status = params.status;
    const [items, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        include: {
          artwork: { select: { id: true, title: true, image: true } },
          artist: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit,
      }),
      prisma.purchaseRequest.count({ where }),
    ]);
    return { items, total };
  },

  async updateStatus(id: string, status: PurchaseRequestStatus) {
    return prisma.purchaseRequest.update({ where: { id }, data: { status } });
  },

  async delete(id: string) {
    return prisma.purchaseRequest.delete({ where: { id } });
  },
};
