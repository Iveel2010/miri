import { withHandler } from "@/lib/http";
import { adminController } from "@/controllers/admin.controller";

export const GET = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return adminController.getArtwork(req, { id });
});

export const PUT = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return adminController.updateArtwork(req, { id });
});

export const PATCH = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return adminController.updateArtwork(req, { id });
});

export const DELETE = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return adminController.deleteArtwork(req, { id });
});
