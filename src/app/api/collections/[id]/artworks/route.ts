import { withHandler } from "@/lib/http";
import { collectionController } from "@/controllers/collection.controller";

export const runtime = 'nodejs';

export const POST = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return collectionController.addArtwork(req, { id });
});
