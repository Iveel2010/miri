import { withHandler } from "@/lib/http";
import { categoryController } from "@/controllers/category.controller";

export const runtime = 'nodejs';

export const PUT = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return categoryController.update(req, { id });
});

export const PATCH = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return categoryController.update(req, { id });
});

export const DELETE = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return categoryController.remove(req, { id });
});
