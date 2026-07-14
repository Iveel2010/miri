import { ApiResponse } from "@/lib/response";
import { getAccessToken } from "@/lib/auth";
import { verifyAccessToken } from "@/lib/jwt";
import { searchService } from "@/services/search.service";
import { num, buildMeta } from "@/lib/validation";

// ============================================================================
// Search controller. Filters by title, artist, category, medium, price and
// supports newest / price / popularity ordering. Public, but attributes the
// search event to the user when authenticated.
// ============================================================================

export const searchController = {
  async search(req: Request) {
    const sp = new URL(req.url).searchParams;
    let userId: string | undefined;
    const token = getAccessToken(req);
    if (token) {
      try {
        userId = verifyAccessToken(token).sub;
      } catch {
        userId = undefined;
      }
    }

    const minPrice = sp.get("minPrice") ? num(sp.get("minPrice")) : null;
    const maxPrice = sp.get("maxPrice") ? num(sp.get("maxPrice")) : null;

    const result = await searchService.search({
      q: sp.get("q"),
      artist: sp.get("artist"),
      category: sp.get("category"),
      medium: sp.get("medium"),
      minPrice,
      maxPrice,
      sort: (sp.get("sort") as "newest" | "price_asc" | "price_desc" | "popular") ?? undefined,
      page: num(sp.get("page"), 1),
      limit: num(sp.get("limit"), 12),
      userId,
    });
    return ApiResponse.paginated(result.items, buildMeta(result.total, num(sp.get("page"), 1), num(sp.get("limit"), 12)));
  },
};
