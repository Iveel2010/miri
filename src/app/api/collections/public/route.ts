import { withHandler } from "@/lib/http";
import { collectionController } from "@/controllers/collection.controller";

export const runtime = 'nodejs';

export const GET = withHandler(() => collectionController.listPublic());
