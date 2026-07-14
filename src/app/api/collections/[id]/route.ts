import { withHandler } from "@/lib/http";
import { collectionController } from "@/controllers/collection.controller";

export const GET = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return collectionController.get(req, { id });
});

export const PUT = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return collectionController.update(req, { id });
});

export const DELETE = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return collectionController.remove(req, { id });
});
