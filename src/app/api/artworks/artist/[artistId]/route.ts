import { withHandler } from "@/lib/http";
import { artworkController } from "@/controllers/artwork.controller";

export const GET = withHandler(async (req, ctx) => {
  const { artistId } = await (ctx as { params: Promise<{ artistId: string }> }).params;
  return artworkController.byArtist(req, { artistId });
});
