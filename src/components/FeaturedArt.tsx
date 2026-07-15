import { SectionTitle } from "./SectionTitle";
import FeaturedCarousel from "./FeaturedCarousel";
import { safeServerApiList } from "@/lib/server-api";
import type { ApiArtwork } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function FeaturedArt() {
  const { items } = await safeServerApiList<ApiArtwork>("/api/artworks?limit=10&sort=popular");

  return (
    <section
      className="px-6 py-20 md:py-28"
      aria-labelledby="featured-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Студийгаас"
          title="Би бүтээсэн жаахан ертөнцүүд"
          subtitle="Миний хамгийн дуртай хэдэн бүтээл — тус бүрийг уужим, ихээхэн хайртайгаар уран бүтээсэн."
          id="featured-heading"
        />

        <FeaturedCarousel items={items ?? []} />
      </div>
    </section>
  );
}
