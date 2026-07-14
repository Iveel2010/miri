import { parseJson } from "@/lib/http";
import { validate, num, buildMeta } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireUser } from "@/lib/auth";
import { reviewService, reviewInputSchema } from "@/services/review.service";

export const reviewController = {
  /** GET /api/artworks/[artworkId]/reviews */
  async list(req: Request, params: { artworkId: string }) {
    const sp = new URL(req.url).searchParams;
    const result = await reviewService.listByArtwork(params.artworkId, num(sp.get("page"), 1), num(sp.get("limit"), 12));
    return ApiResponse.paginated(result.items, buildMeta(result.total, num(sp.get("page"), 1), num(sp.get("limit"), 12)), 200);
  },

  /** POST /api/artworks/[artworkId]/reviews */
  async create(req: Request, params: { artworkId: string }) {
    const { sub } = requireUser(req);
    const input = validate(reviewInputSchema, await parseJson(req));
    const review = await reviewService.create(sub, params.artworkId, input);
    return ApiResponse.created(review, "Review submitted");
  },

  /** DELETE /api/artworks/[artworkId]/reviews */
  async remove(req: Request, params: { artworkId: string }) {
    const { sub } = requireUser(req);
    await reviewService.remove(sub, params.artworkId);
    return ApiResponse.noContent();
  },
};
