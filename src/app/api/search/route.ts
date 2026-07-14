import { withHandler } from "@/lib/http";
import { searchController } from "@/controllers/search.controller";

export const runtime = 'nodejs';

export const GET = withHandler((req) => searchController.search(req));
