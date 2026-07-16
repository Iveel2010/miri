import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { purchaseRequestRepository } from "@/repositories/purchase-request.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { trigger } from "@/lib/pusher";

export const purchaseRequestInputSchema = z.object({
  buyerName: z.string().min(1, "Нэр шаардлагатай").max(100),
  buyerPhone: z.string().min(1, "Утасны дугаар шаардлагатай").max(40),
  buyerEmail: z.string().email("Буруу и-мэйл").max(120).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export const purchaseRequestService = {
  async submit(artworkId: string, input: z.infer<typeof purchaseRequestInputSchema>) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      select: { id: true, title: true, artistId: true },
    });
    if (!artwork) throw new NotFoundError("Artwork not found");

    const request = await purchaseRequestRepository.create({
      buyerName: input.buyerName.trim(),
      buyerPhone: input.buyerPhone.trim(),
      buyerEmail: input.buyerEmail?.trim() ?? null,
      message: input.message?.trim() ?? null,
      artworkId: artwork.id,
      artistId: artwork.artistId,
    });

    await notificationRepository.create({
      userId: artwork.artistId,
      type: "PURCHASE_REQUEST",
      title: "Шинэ худалдан авах хүсэлт",
      body: `${input.buyerName} «${artwork.title}» бүтээлийг худалдан авахыг хүсч байна.`,
      relatedId: request.id,
    });

    trigger("private-admin", "new-purchase-request", {
      id: request.id,
      buyerName: request.buyerName,
      buyerPhone: request.buyerPhone,
      artworkId: artwork.id,
      artworkTitle: artwork.title,
      status: request.status,
      createdAt: request.createdAt,
    });

    trigger("private-admin", "stats-update", {});

    return request;
  },

  async listForAdmin(params: { page: number; limit: number; status?: "NEW" | "CONTACTED" | "RESERVED" | "SOLD" | "CANCELLED" }) {
    const result = await purchaseRequestRepository.listForAdmin({
      page: params.page,
      limit: params.limit,
      status: params.status,
    });
    return result;
  },

  async updateStatus(id: string, status: "NEW" | "CONTACTED" | "RESERVED" | "SOLD" | "CANCELLED") {
    const request = await purchaseRequestRepository.findById(id);
    if (!request) throw new NotFoundError("Purchase request not found");
    return purchaseRequestRepository.updateStatus(id, status);
  },

  async delete(id: string) {
    const request = await purchaseRequestRepository.findById(id);
    if (!request) throw new NotFoundError("Purchase request not found");
    return purchaseRequestRepository.delete(id);
  },
};
