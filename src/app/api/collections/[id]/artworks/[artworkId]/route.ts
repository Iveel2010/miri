import { withHandler } from "@/lib/http";
import { collectionController } from "@/controllers/collection.controller";

export const runtime = 'nodejs';

export const DELETE = withHandler(async (req, ctx) => {
  const { id, artworkId } = await (ctx as { params: Promise<{ id: string; artworkId: string }> }).params;
  return collectionController.removeArtwork(req, { id, artworkId });
});
