import { withHandler } from "@/lib/http";
import { adminController } from "@/controllers/admin.controller";

export const runtime = 'nodejs';

export const GET = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return adminController.getArtist(req, { id });
});

export const PATCH = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return adminController.updateArtistContact(req, { id });
});
