import { withHandler } from "@/lib/http";
import { artworkController } from "@/controllers/artwork.controller";

export const POST = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return artworkController.publish(req, { id });
});
