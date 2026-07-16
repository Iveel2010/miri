import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { orderRepository } from "@/repositories/order.repository";
import { analyticsRepository } from "@/repositories/analytics.repository";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { OrderStatus } from "@prisma/client";
import { trigger } from "@/lib/pusher";

export const purchaseSchema = z.object({
  items: z.array(z.object({ artworkId: z.string().min(1), quantity: z.number().int().positive().max(10).optional() })).min(1),
  shippingAddress: z.string().max(500).optional(),
});

export const orderService = {
  /**
   * Purchase one or more published artworks. Runs in a transaction so stock
   * state and the order are consistent.
   */
  async purchase(userId: string, input: z.infer<typeof purchaseSchema>) {
    return prisma.$transaction(async (tx) => {
      const artworkIds = input.items.map((i) => i.artworkId);
      const artworks = await tx.artwork.findMany({ where: { id: { in: artworkIds } } });
      if (artworks.length !== artworkIds.length) {
        throw new NotFoundError("One or more artworks not found");
      }

      const orderItems: Array<{ artworkId: string; title: string; image: string | null; price: number; quantity: number }> = [];
      let total = 0;
      const artists = new Set<string>();

      for (const item of input.items) {
        const art = artworks.find((a) => a.id === item.artworkId)!;
        if (art.status !== "PUBLISHED") {
          throw new ForbiddenError(`"${art.title}" is not available for purchase`);
        }
        const qty = item.quantity ?? 1;
        total += art.price * qty;
        artists.add(art.artistId);
        orderItems.push({
          artworkId: art.id,
          title: art.title,
          image: art.image,
          price: art.price,
          quantity: qty,
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          total,
          shippingAddress: input.shippingAddress,
          status: "PAID",
          paymentStatus: "PAID",
          items: { create: orderItems },
        },
        include: { items: true, user: { select: { id: true, name: true, email: true } } },
      });

      // Mark purchased artworks as sold and notify their artists.
      for (const art of artworks) {
        await tx.artwork.update({ where: { id: art.id }, data: { status: "SOLD" } });
        await tx.notification.create({
          data: {
            userId: art.artistId,
            type: "ORDER_PLACED",
            title: "New sale!",
            body: `Your artwork "${art.title}" was purchased.`,
            relatedId: order.id,
          },
        });
      }

      await analyticsRepository.track("PURCHASE", { userId, metadata: { orderId: order.id, total } });

      trigger("private-admin", "new-order", {
        id: order.id,
        total,
        itemCount: order.items.length,
        userId: order.userId,
        userName: order.user?.name,
        createdAt: order.createdAt,
      });

      trigger("private-admin", "stats-update", {});

      return order;
    });
  },

  async listByUser(userId: string, page = 1, limit = 12) {
    return orderRepository.findByUser(userId, { skip: (page - 1) * limit, take: limit });
  },

  async getById(id: string, userId: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw new NotFoundError("Order not found");
    if (order.userId !== userId) {
      throw new ForbiddenError("Not your order");
    }
    return order;
  },

  async updateStatus(id: string, status: OrderStatus) {
    const order = await orderRepository.findById(id);
    if (!order) throw new NotFoundError("Order not found");
    return orderRepository.update(id, { status, paymentStatus: status === "CANCELLED" ? "REFUNDED" : order.paymentStatus });
  },
};
