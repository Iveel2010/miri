import { withHandler } from "@/lib/http";
import { artistController } from "@/controllers/artist.controller";

export const runtime = 'nodejs';

export const GET = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return artistController.getById(req, { id });
});
