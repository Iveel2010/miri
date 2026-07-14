import { withHandler } from "@/lib/http";
import { collectionController } from "@/controllers/collection.controller";

export const runtime = 'nodejs';

export const GET = withHandler((req) => collectionController.list(req));
export const POST = withHandler((req) => collectionController.create(req));
