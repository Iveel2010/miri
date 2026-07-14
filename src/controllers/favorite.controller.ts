import { z } from "zod";
import { parseJson } from "@/lib/http";
import { validate, num, buildMeta } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireUser } from "@/lib/auth";
import { favoriteService } from "@/services/favorite.service";

const toggleSchema = z.object({ artworkId: z.string().min(1) });

export const favoriteController = {
  /** GET /api/favorites */
  async list(req: Request) {
    const { sub } = requireUser(req);
    const sp = new URL(req.url).searchParams;
    const result = await favoriteService.list(sub, num(sp.get("page"), 1), num(sp.get("limit"), 12));
    return ApiResponse.paginated(result.items, buildMeta(result.total, num(sp.get("page"), 1), num(sp.get("limit"), 12)));
  },

  /** POST /api/favorites/toggle */
  async toggle(req: Request) {
    const { sub } = requireUser(req);
    const body = await parseJson(req);
    const { artworkId } = validate(toggleSchema, body);
    const res = await favoriteService.toggle(sub, artworkId);
    return ApiResponse.ok(res, 200, res.favorited ? "Added to favorites" : "Removed from favorites");
  },
};
