import type { Metadata } from "next";
import { serverApi, serverApiList } from "@/lib/server-api";
import { toArtworks } from "@/lib/mappers";
import { GalleryExplorer } from "@/components/GalleryExplorer";
import type { ApiArtwork, ApiCategory } from "@/types/api";

export const metadata: Metadata = {
  title: "Урлас · Miry",
  description: "Miry-ийн бүх уран бүтээлүүд — хайх, шүүж, захиалах.",
};

// Data is dynamic (comes from the REST API), so render per request.
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [list, cats] = await Promise.all([
    serverApiList<ApiArtwork>("/api/artworks?limit=12&sort=newest"),
    serverApi<ApiCategory[]>("/api/categories"),
  ]);

  const categories = cats.map((c) => ({ name: c.name, id: c.id }));

  return (
    <GalleryExplorer
      initialArtworks={toArtworks(list.items)}
      initialMeta={list.meta}
      categories={categories}
    />
  );
}
