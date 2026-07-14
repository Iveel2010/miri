import { ApiResponse } from "@/lib/response";
import { artistService } from "@/services/artist.service";

// ============================================================================
// Artist controllers — public read of an artist's contact profile.
// ============================================================================

export const artistController = {
  /** GET /api/artists/:id */
  async getById(_req: Request, params: { id: string }) {
    const artist = await artistService.getPublicProfile(params.id);
    return ApiResponse.ok(artist);
  },
};
