import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { ApiResponse } from "@/lib/response";
import { getAccessToken, requireUser } from "@/lib/auth";
import { verifyAccessToken } from "@/lib/jwt";
import { parseJson } from "@/lib/http";
import { validate } from "@/lib/validation";
import { analyticsService } from "@/services/analytics.service";

// ============================================================================
// Analytics controllers. Artists see their own stats.
// ============================================================================

export const analyticsController = {
  /** GET /api/analytics — artist's own analytics */
  async forArtist(req: Request) {
    const { sub } = requireUser(req);
    const data = await analyticsService.forArtist(sub);
    return ApiResponse.ok(data);
  },

  /** POST /api/analytics/track — record a client analytics event. */
  async track(req: Request) {
    const body = await parseJson(req);
    const { type, artworkId, metadata } = validate(trackEventSchema, body);

    let userId: string | undefined;
    const token = getAccessToken(req);
    if (token) {
      try {
        userId = verifyAccessToken(token).sub;
      } catch {
        userId = undefined;
      }
    }

    await analyticsService.track({
      type,
      userId,
      artworkId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    });
    return ApiResponse.ok({ tracked: true });
  },
};

const trackEventSchema = z.object({
  type: z.enum(["VIEW_ARTWORK", "VISIT", "SEARCH", "FAVORITE", "PURCHASE"]),
  artworkId: z.string().cuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});
