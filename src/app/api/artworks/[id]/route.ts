import { withHandler } from "@/lib/http";
import { artworkController } from "@/controllers/artwork.controller";

export const GET = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return artworkController.getById(req, { id });
});

export const PUT = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return artworkController.update(req, { id });
});

export const DELETE = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return artworkController.remove(req, { id });
});
