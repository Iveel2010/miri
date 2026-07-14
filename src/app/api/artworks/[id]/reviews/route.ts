import { withHandler } from "@/lib/http";
import { reviewController } from "@/controllers/review.controller";

export const GET = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return reviewController.list(req, { artworkId: id });
});

export const POST = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return reviewController.create(req, { artworkId: id });
});

export const DELETE = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return reviewController.remove(req, { artworkId: id });
});
