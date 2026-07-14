import type { Metadata } from "next";
import { serverApi, serverApiList } from "@/lib/server-api";
import { toArtworks } from "@/lib/mappers";
import ShopHero from "@/components/shop/ShopHero";
import ShopFeatured from "@/components/shop/ShopFeatured";
import ShopCurated, { type ShopCollection } from "@/components/shop/ShopCurated";
import ShopArtist, {
  type ShopArtistProfile,
  type ShopArtistWork,
} from "@/components/shop/ShopArtist";
import { ShopGrid } from "@/components/ShopGrid";
import type {
  ApiArtwork,
  ApiCategory,
  ApiCollection,
  ApiArtistProfile,
} from "@/types/api";

export const metadata: Metadata = {
  title: "Онцгой бүтээлүүд · MIRI collection",
  description:
    "MIRI-ийн хамгийн онцгой бүтээлүүд — цөөн тоогоор бүтээсэн, дахин давтагдашгүй болон Limited Edition зураг. Зураг бүр өөрийн түүх, үнэ цэнэ, мэдрэмжийг хадгалсан.",
};

const ACCENTS = ["#dcd6ea", "#e4dacd", "#d9a7a0", "#cfc9da", "#d8b1ab", "#e6dcc9"];

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [list, cats, collections] = await Promise.all([
    serverApiList<ApiArtwork>("/api/artworks?limit=12&sort=newest&featured=true"),
    serverApi<ApiCategory[]>("/api/categories"),
    serverApiList<ApiCollection>("/api/collections/public"),
  ]);
  const categories = cats.map((c) => ({ name: c.name, id: c.id }));
  const artworks = toArtworks(list.items);

  // Featured artist = the artist behind the first featured artwork.
  const featuredArtistId = list.items[0]?.artist.id;
  const artist =
    featuredArtistId != null
      ? await serverApi<ApiArtistProfile>(`/api/artists/${featuredArtistId}`).catch(
          () => null,
        )
      : null;
  const artistWorks: ShopArtistWork[] = artist
    ? list.items
        .filter((a) => a.artist.id === artist.id)
        .map((a) => ({
          id: a.id,
          title: a.title,
          year: String(a.year ?? ""),
          image: a.image,
        }))
    : [];

  const shopCollections: ShopCollection[] = collections.items.map((c, i) => ({
    id: c.id,
    name: c.title,
    tagline: c.description?.split(".")[0]?.slice(0, 48) ?? "Curated selection",
    image: c.coverImage ?? "",
    accent: ACCENTS[i % ACCENTS.length],
  }));

  const featuredArtist: ShopArtistProfile | null = artist
    ? {
        name: artist.name,
        location: artist.location,
        portrait: artist.avatar || "/misheel.jpg",
        bio: artist.bio,
      }
    : null;

  return (
    <main className="bg-shop text-shop-ink">
      <ShopHero />
      <ShopFeatured items={artworks} />
      {featuredArtist && (
        <ShopArtist artist={featuredArtist} works={artistWorks} />
      )}
      <ShopCurated collections={shopCollections} />
      <ShopGrid
        initialArtworks={artworks}
        initialMeta={list.meta}
        categories={categories}
      />
    </main>
  );
}
