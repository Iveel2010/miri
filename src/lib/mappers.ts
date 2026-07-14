import type { Artwork } from "@/types/artwork";
import type {
  ApiArtwork,
  ApiCategory,
  ApiCategoryRef,
  Paginated,
} from "@/types/api";

// ============================================================================
// Map backend API shapes -> frontend UI types. The backend returns
// `artist`/`category` as objects and `year`/`price` as numbers; the UI
// components expect flattened strings, so we adapt here in one place.
// ============================================================================

export function toArtwork(a: ApiArtwork): Artwork {
  return {
    id: a.id,
    title: a.title,
    artist: a.artist?.name ?? "Unknown",
    category: a.category?.name ?? "—",
    image: a.image,
    medium: a.medium ?? undefined,
    year: a.year != null ? String(a.year) : undefined,
    description: a.description ?? undefined,
    dimensions:
      a.width != null && a.height != null
        ? `${a.width} × ${a.height} см`
        : undefined,
    edition: undefined,
    availability: a.availability ?? undefined,
    price: a.price,
    slug: a.slug,
    status: a.status,
    images: a.images?.length ? a.images : [a.image],
    featured: a.isFeatured,
  };
}

export function toArtworks(list: ApiArtwork[]): Artwork[] {
  return list.map(toArtwork);
}

export function categoriesToMap(cats: ApiCategory[]): Map<string, string> {
  // name -> id (gallery UI filters by name, backend expects id)
  return new Map(cats.map((c) => [c.name, c.id]));
}

export function categoryRefToName(c: ApiCategoryRef | null): string {
  return c?.name ?? "—";
}

export type { Paginated };
