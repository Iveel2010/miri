import { withHandler } from "@/lib/http";
import { categoryController } from "@/controllers/category.controller";

export const runtime = 'nodejs';

export const GET = withHandler(() => categoryController.list());
