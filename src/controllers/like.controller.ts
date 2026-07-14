import { parseJson } from "@/lib/http";
import { ApiResponse } from "@/lib/response";
import { requireUser } from "@/lib/auth";
import { likeService } from "@/services/like.service";
import { z } from "zod";

const toggleSchema = z.object({ artworkId: z.string().min(1) });

export const likeController = {
  /** POST /api/likes/toggle */
  async toggle(req: Request) {
    const { sub } = requireUser(req);
    const body = await parseJson(req);
    const { artworkId } = validateToggle(body);
    const res = await likeService.toggle(sub, artworkId);
    return ApiResponse.ok(res, 200, res.liked ? "Liked" : "Unliked");
  },
};

function validateToggle(body: unknown) {
  return toggleSchema.parse(body);
}
